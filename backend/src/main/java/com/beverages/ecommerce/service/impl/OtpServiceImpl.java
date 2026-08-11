package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.entity.User;
import com.beverages.ecommerce.exception.OtpExpiredException;
import com.beverages.ecommerce.exception.OtpInvalidException;
import com.beverages.ecommerce.exception.OtpResendLimitExceededException;
import com.beverages.ecommerce.service.OtpService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class OtpServiceImpl implements OtpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${app.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${app.otp.resend-interval-seconds:60}")
    private long resendIntervalSeconds;

    @Value("${app.otp.max-resends:5}")
    private int maxResends;

    @Override
    public String issueOtp(User user, boolean resend) {
        if (resend) {
            enforceResendLimit(user);
        }

        String otp = generateOtp();
        LocalDateTime now = LocalDateTime.now();

        user.setOtp(otp);
        user.setOtpExpiry(now.plusMinutes(otpExpiryMinutes));
        user.setOtpLastSentAt(now);
        user.setOtpResendCount(resend ? (user.getOtpResendCount() == null ? 1 : user.getOtpResendCount() + 1) : 0);

        return otp;
    }

    @Override
    public void validateOtp(User user, String otp) {
        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            throw new OtpInvalidException("OTP Invalid");
        }
        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new OtpExpiredException("OTP Expired. Please request a new code.");
        }
    }

    @Override
    public void clearOtp(User user) {
        user.setOtp(null);
        user.setOtpExpiry(null);
        user.setOtpResendCount(0);
        user.setOtpLastSentAt(null);
    }

    private void enforceResendLimit(User user) {
        if (user.getOtpLastSentAt() != null) {
            long elapsedSeconds = Duration.between(user.getOtpLastSentAt(), LocalDateTime.now()).getSeconds();
            if (elapsedSeconds < resendIntervalSeconds) {
                long waitSeconds = resendIntervalSeconds - elapsedSeconds;
                throw new OtpResendLimitExceededException(
                        "Please wait " + waitSeconds + " seconds before requesting another OTP.");
            }
        }
        if (user.getOtpResendCount() != null && user.getOtpResendCount() >= maxResends) {
            throw new OtpResendLimitExceededException(
                    "Too many OTP requests. Please try again after some time.");
        }
    }

    private String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }
}
