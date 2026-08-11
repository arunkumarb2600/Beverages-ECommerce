package com.beverages.ecommerce.service;

import com.beverages.ecommerce.dto.PaymentDTO;
import com.beverages.ecommerce.dto.PaymentVerificationRequest;
import com.beverages.ecommerce.dto.RazorpayCreateOrderRequest;
import com.beverages.ecommerce.dto.RazorpayCreateOrderResponse;

public interface PaymentService {

    RazorpayCreateOrderResponse createPaymentOrder(Long userId, RazorpayCreateOrderRequest request);

    PaymentDTO verifyPayment(Long userId, PaymentVerificationRequest request);
}
