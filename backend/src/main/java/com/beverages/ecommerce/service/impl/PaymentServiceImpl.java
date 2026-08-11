package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.dto.PaymentDTO;
import com.beverages.ecommerce.dto.PaymentVerificationRequest;
import com.beverages.ecommerce.dto.RazorpayCreateOrderRequest;
import com.beverages.ecommerce.dto.RazorpayCreateOrderResponse;
import com.beverages.ecommerce.entity.Order;
import com.beverages.ecommerce.entity.Payment;
import com.beverages.ecommerce.exception.BadRequestException;
import com.beverages.ecommerce.exception.ResourceNotFoundException;
import com.beverages.ecommerce.repository.OrderRepository;
import com.beverages.ecommerce.repository.PaymentRepository;
import com.beverages.ecommerce.service.EmailService;
import com.beverages.ecommerce.service.PaymentService;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final String CURRENCY = "INR";

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final RazorpayClient razorpayClient;
    private final EmailService emailService;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              OrderRepository orderRepository,
                              RazorpayClient razorpayClient,
                              EmailService emailService) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.razorpayClient = razorpayClient;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public RazorpayCreateOrderResponse createPaymentOrder(Long userId, RazorpayCreateOrderRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + request.getOrderId()));

        if (!order.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("Access denied: You cannot pay for orders placed by other users");
        }
        if ("CONFIRMED".equalsIgnoreCase(order.getStatus())
                || "COMPLETED".equalsIgnoreCase(order.getStatus())
                || "CANCELLED".equalsIgnoreCase(order.getStatus())) {
            throw new BadRequestException("Order cannot be paid: current status is " + order.getStatus());
        }

        // Razorpay expects the amount in the smallest currency unit (paise).
        long amountInPaise = order.getTotal().multiply(BigDecimal.valueOf(100)).longValue();

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", CURRENCY);
        orderRequest.put("receipt", "order_" + order.getOrderId());
        orderRequest.put("notes", new JSONObject()
                .put("order_id", order.getOrderId())
                .put("user_id", userId));

        String razorpayOrderId;
        try {
            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            razorpayOrderId = razorpayOrder.get("id");
        } catch (RazorpayException ex) {
            throw new BadRequestException("Failed to create Razorpay order: " + ex.getMessage());
        }

        // Upsert the payment record for this order.
        Payment payment = paymentRepository.findByOrderOrderId(order.getOrderId())
                .orElseGet(Payment::new);
        payment.setOrder(order);
        payment.setUserId(userId);
        payment.setPaymentMethod("RAZORPAY");
        payment.setPaymentStatus("PENDING");
        payment.setAmount(order.getTotal());
        payment.setCurrency(CURRENCY);
        payment.setRazorpayOrderId(razorpayOrderId);
        payment.setUpdatedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        return RazorpayCreateOrderResponse.builder()
                .razorpayOrderId(razorpayOrderId)
                .amount(order.getTotal())
                .amountInPaise(amountInPaise)
                .currency(CURRENCY)
                .keyId(keyId)
                .build();
    }

    @Override
    @Transactional
    public PaymentDTO verifyPayment(Long userId, PaymentVerificationRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + request.getOrderId()));

        if (!order.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("Access denied: You cannot verify payments for orders placed by other users");
        }

        // Rebuild the exact payload Razorpay signed: order_id|payment_id
        JSONObject attributes = new JSONObject();
        attributes.put("razorpay_order_id", request.getRazorpayOrderId());
        attributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
        attributes.put("razorpay_signature", request.getRazorpaySignature());

        boolean signatureValid;
        try {
            signatureValid = Utils.verifyPaymentSignature(attributes, keySecret);
        } catch (RazorpayException ex) {
            throw new BadRequestException("Failed to verify payment signature");
        }

        // NEVER trust the frontend: if the signature is invalid, reject the payment.
        if (!signatureValid) {
            throw new BadRequestException("Invalid payment signature. Payment could not be verified.");
        }

        Payment payment = paymentRepository.findByOrderOrderId(order.getOrderId())
                .orElseGet(Payment::new);
        payment.setOrder(order);
        payment.setUserId(userId);
        payment.setPaymentMethod("RAZORPAY");
        payment.setPaymentStatus("SUCCESS");
        payment.setAmount(order.getTotal());
        payment.setCurrency(CURRENCY);
        payment.setRazorpayOrderId(request.getRazorpayOrderId());
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setTransactionId(request.getRazorpayPaymentId());
        payment.setUpdatedAt(LocalDateTime.now());
        Payment savedPayment = paymentRepository.save(payment);
        paymentRepository.flush();

        // Update order status
        if (!"CONFIRMED".equalsIgnoreCase(order.getStatus())) {
            order.setStatus("CONFIRMED");
            orderRepository.save(order);
        }

        // Send order confirmation email after a successful payment.
        emailService.sendOrderConfirmation(order.getUser().getEmail(), order.getUser().getName(),
                order.getOrderId(), order.getTotal());

        Payment refreshed = paymentRepository.findById(savedPayment.getPaymentId())
                .orElse(savedPayment);
        return mapToDTO(refreshed);
    }

    private PaymentDTO mapToDTO(Payment payment) {
        return PaymentDTO.builder()
                .paymentId(payment.getPaymentId())
                .orderId(payment.getOrder().getOrderId())
                .userId(payment.getUserId())
                .razorpayOrderId(payment.getRazorpayOrderId())
                .razorpayPaymentId(payment.getRazorpayPaymentId())
                .razorpaySignature(payment.getRazorpaySignature())
                .transactionId(payment.getTransactionId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
