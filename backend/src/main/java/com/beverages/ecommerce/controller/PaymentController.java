package com.beverages.ecommerce.controller;

import com.beverages.ecommerce.dto.PaymentDTO;
import com.beverages.ecommerce.dto.PaymentVerificationRequest;
import com.beverages.ecommerce.dto.RazorpayCreateOrderRequest;
import com.beverages.ecommerce.dto.RazorpayCreateOrderResponse;
import com.beverages.ecommerce.security.CustomUserDetails;
import com.beverages.ecommerce.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payments", description = "Razorpay payment integration endpoints")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order")
    @Operation(summary = "Create Razorpay order",
            description = "Creates a Razorpay order for an existing app order and returns the Razorpay order id, amount and key id required to open the Razorpay Checkout. Only the key id is exposed; the secret stays on the server.")
    public ResponseEntity<RazorpayCreateOrderResponse> createOrder(@Valid @RequestBody RazorpayCreateOrderRequest request,
                                                                   @AuthenticationPrincipal CustomUserDetails userDetails) {
        RazorpayCreateOrderResponse response = paymentService.createPaymentOrder(userDetails.getId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify Razorpay payment",
            description = "Verifies the Razorpay payment signature server-side. On success the payment is marked SUCCESS and the order status is updated to CONFIRMED.")
    public ResponseEntity<PaymentDTO> verify(@Valid @RequestBody PaymentVerificationRequest request,
                                             @AuthenticationPrincipal CustomUserDetails userDetails) {
        PaymentDTO payment = paymentService.verifyPayment(userDetails.getId(), request);
        return ResponseEntity.ok(payment);
    }
}
