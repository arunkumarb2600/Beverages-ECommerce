package com.beverages.ecommerce.service;

import java.math.BigDecimal;

public interface EmailService {

    /** Sends the registration OTP to verify a new account. */
    void sendRegistrationOtp(String to, String name, String otp);

    /** Sends a confirmation once the account email has been verified. */
    void sendVerificationConfirmation(String to, String name);

    /** Sends the OTP for the forgot-password flow. */
    void sendPasswordResetOtp(String to, String name, String otp);

    /** Sends a confirmation once the password has been reset. */
    void sendPasswordResetConfirmation(String to, String name);

    /** Sends a freshly generated OTP when the user requests a resend. */
    void sendResentOtp(String to, String name, String otp);

    /** Sends an order confirmation after a successful payment (or COD confirmation). */
    void sendOrderConfirmation(String to, String name, Long orderId, BigDecimal total);
}
