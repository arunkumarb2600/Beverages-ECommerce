package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.dto.OrderCreateRequest;
import com.beverages.ecommerce.dto.OrderDTO;
import com.beverages.ecommerce.dto.OrderItemDTO;
import com.beverages.ecommerce.entity.Order;
import com.beverages.ecommerce.entity.OrderItem;
import com.beverages.ecommerce.entity.Payment;
import com.beverages.ecommerce.entity.Product;
import com.beverages.ecommerce.entity.User;
import com.beverages.ecommerce.exception.BadRequestException;
import com.beverages.ecommerce.exception.ResourceNotFoundException;
import com.beverages.ecommerce.repository.CartRepository;
import com.beverages.ecommerce.repository.OrderRepository;
import com.beverages.ecommerce.repository.PaymentRepository;
import com.beverages.ecommerce.repository.ProductRepository;
import com.beverages.ecommerce.repository.UserRepository;
import com.beverages.ecommerce.service.EmailService;
import com.beverages.ecommerce.service.OrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;

    public OrderServiceImpl(OrderRepository orderRepository,
                            ProductRepository productRepository,
                            UserRepository userRepository,
                            CartRepository cartRepository,
                            PaymentRepository paymentRepository,
                            EmailService emailService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.paymentRepository = paymentRepository;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public OrderDTO createOrder(OrderCreateRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        String paymentMethod = request.getPaymentMethod();
        boolean isCod = "COD".equalsIgnoreCase(paymentMethod);
        boolean isRazorpay = paymentMethod == null || "RAZORPAY".equalsIgnoreCase(paymentMethod);
        if (!isCod && !isRazorpay) {
            throw new BadRequestException("Invalid payment method: " + paymentMethod + ". Supported methods: COD, RAZORPAY");
        }

        Order order = Order.builder()
                .user(user)
                .status("PENDING")
                .total(BigDecimal.ZERO)
                .build();

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal orderTotal = BigDecimal.ZERO;

        for (var itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemReq.getProductId()));

            if (product.getStock() < itemReq.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product: " + product.getProductName() 
                        + ". Available stock: " + product.getStock());
            }

            // Deduct stock
            product.setStock(product.getStock() - itemReq.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .price(product.getPrice())
                    .build();

            orderItems.add(orderItem);
            
            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            orderTotal = orderTotal.add(itemTotal);
        }

        order.setOrderItems(orderItems);
        order.setTotal(orderTotal);

        Order savedOrder = orderRepository.save(order);

        // COD: confirm the order immediately and record the payment.
        if (isCod) {
            savedOrder.setStatus("CONFIRMED");
            savedOrder = orderRepository.save(savedOrder);

            Payment payment = Payment.builder()
                    .order(savedOrder)
                    .userId(userId)
                    .paymentMethod("COD")
                    .paymentStatus("SUCCESS")
                    .amount(orderTotal)
                    .currency("INR")
                    .build();
            paymentRepository.save(payment);

            emailService.sendOrderConfirmation(user.getEmail(), user.getName(), savedOrder.getOrderId(), orderTotal);
        }

        return mapToDTO(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long id, Long userId, String userRole) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));

        // Security check: only order owner or admins can view
        if (!"ADMIN".equalsIgnoreCase(userRole) && !order.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("Access denied: You cannot view orders placed by other users");
        }

        return mapToDTO(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDTO> getUserOrders(Long userId) {
        return orderRepository.findByUserUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private static final List<String> ALLOWED_STATUSES = List.of(
            "PENDING", "CONFIRMED", "PROCESSING", "PACKED",
            "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "CANCELLED");

    @Override
    @Transactional
    public OrderDTO updateOrderStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));

        if (status == null || status.trim().isEmpty()) {
            throw new BadRequestException("Order status is required");
        }

        String normalized = status.trim().replaceAll("\\s+", "_").toUpperCase();
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new BadRequestException("Invalid order status: " + status
                    + ". Allowed statuses: " + String.join(", ", ALLOWED_STATUSES));
        }

        order.setStatus(normalized);
        Order updated = orderRepository.save(order);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteOrder(Long id, Long userId, String userRole) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));

        // Security check: only order owner or admins can delete
        if (!"ADMIN".equalsIgnoreCase(userRole) && !order.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("Access denied: You cannot delete orders placed by other users");
        }

        // Restore stock for deleted order if it is in PENDING status
        if ("PENDING".equalsIgnoreCase(order.getStatus())) {
            for (OrderItem item : order.getOrderItems()) {
                Product product = item.getProduct();
                product.setStock(product.getStock() + item.getQuantity());
                productRepository.save(product);
            }
        }

        orderRepository.delete(order);
    }

    private OrderDTO mapToDTO(Order order) {
        List<OrderItemDTO> itemDTOs = order.getOrderItems().stream()
                .map(item -> OrderItemDTO.builder()
                        .orderItemId(item.getOrderItemId())
                        .productId(item.getProduct().getProductId())
                        .productName(item.getProduct().getProductName())
                        .brand(item.getProduct().getBrand())
                        .imageUrl(item.getProduct().getImageUrl())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .build())
                .collect(Collectors.toList());

        Payment payment = paymentRepository.findByOrderOrderId(order.getOrderId()).orElse(null);

        return OrderDTO.builder()
                .orderId(order.getOrderId())
                .userId(order.getUser().getUserId())
                .userName(order.getUser().getName())
                .userEmail(order.getUser().getEmail())
                .status(order.getStatus())
                .total(order.getTotal())
                .createdAt(order.getCreatedAt())
                .paymentStatus(payment != null ? payment.getPaymentStatus() : null)
                .paymentMethod(payment != null ? payment.getPaymentMethod() : null)
                .items(itemDTOs)
                .build();
    }
}
