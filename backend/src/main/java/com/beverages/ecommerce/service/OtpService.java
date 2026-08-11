package com.beverages.ecommerce.service;

import com.beverages.ecommerce.entity.User;

public interface OtpService {

    /**
     * Generates a fresh 6-digit OTP, stores it on the user (with expiry and send tracking)
     * and returns it so the caller can deliver it. When {@code resend} is true the resend
     * rate limits are enforced and the resend counter is incremented; otherwise the counter
     * is reset (initial issue for registration / password reset).
     */
    String issueOtp(User user, boolean resend);

    /**
     * Validates that the stored OTP matches and has not expired. Throws
     * {@link com.beverages.ecommerce.exception.OtpInvalidException} or
     * {@link com.beverages.ecommerce.exception.OtpExpiredException} on failure.
     */
    void validateOtp(User user, String otp);

    /** Clears the OTP fields after a successful one-time use. */
    void clearOtp(User user);
}
