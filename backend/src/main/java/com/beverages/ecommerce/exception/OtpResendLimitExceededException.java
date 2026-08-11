package com.beverages.ecommerce.exception;

public class OtpResendLimitExceededException extends RuntimeException {
    public OtpResendLimitExceededException(String message) {
        super(message);
    }
}
