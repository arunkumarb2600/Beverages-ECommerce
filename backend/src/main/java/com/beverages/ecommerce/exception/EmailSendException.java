package com.beverages.ecommerce.exception;

/**
 * Thrown when an outbound email could not be delivered (SMTP auth failure,
 * network error, invalid credentials, etc.). The message is safe to show
 * to the end user and always includes the underlying SMTP detail for debugging.
 */
public class EmailSendException extends RuntimeException {

    public EmailSendException(String message) {
        super(message);
    }

    public EmailSendException(String message, Throwable cause) {
        super(message, cause);
    }
}
