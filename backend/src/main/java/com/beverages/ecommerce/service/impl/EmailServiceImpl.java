package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.exception.EmailSendException;
import com.beverages.ecommerce.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:no-reply@refreshup.com}")
    private String fromAddress;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendRegistrationOtp(String to, String name, String otp) {
        sendOtpEmail(to, name, otp, "Verify Your RefreshUp Account",
                "to confirm your email address and activate your account.");
    }

    @Override
    public void sendVerificationConfirmation(String to, String name) {
        sendHtmlEmail(to, "Welcome to RefreshUp - Email Verified", buildConfirmationHtml(name,
                "Your email address has been verified successfully.",
                "Your account is now active. You can log in and start ordering your favorite beverages."));
    }

    @Override
    public void sendPasswordResetOtp(String to, String name, String otp) {
        sendOtpEmail(to, name, otp, "Reset Your RefreshUp Account Password",
                "to complete resetting your password.");
    }

    @Override
    public void sendPasswordResetConfirmation(String to, String name) {
        sendHtmlEmail(to, "Your RefreshUp Password Was Changed", buildConfirmationHtml(name,
                "Your password was changed successfully.",
                "If you did not make this change, please contact support immediately and reset your password."));
    }

    @Override
    public void sendResentOtp(String to, String name, String otp) {
        sendOtpEmail(to, name, otp, "Your New RefreshUp Verification Code",
                "to verify your account. This new code replaces any previous code.");
    }

    @Override
    @Async("taskExecutor")
    public void sendOrderConfirmation(String to, String name, Long orderId, BigDecimal total) {
        String content =
                "<div style=\"margin:0 0 20px;padding:16px;background-color:#ecfdf5;border:1px solid #d1fae5;border-radius:8px;\">" +
                "<p style=\"margin:0;color:#047857;font-size:15px;font-weight:700;line-height:1.6;\">Your order has been confirmed successfully.</p>" +
                "</div>" +
                "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:0 0 20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;\">" +
                "<tr style=\"background-color:#f8fafc;\">" +
                "<td style=\"padding:12px 16px;color:#0f172a;font-size:14px;\">Order Reference</td>" +
                "<td style=\"padding:12px 16px;color:#047857;font-size:14px;font-weight:700;\">#RU-" + orderId + "</td>" +
                "</tr>" +
                "<tr>" +
                "<td style=\"padding:12px 16px;background-color:#f8fafc;color:#0f172a;font-size:14px;\">Order Total</td>" +
                "<td style=\"padding:12px 16px;color:#0f172a;font-size:14px;font-weight:700;\">&#8377; " + total.toPlainString() + "</td>" +
                "</tr>" +
                "</table>" +
                "<p style=\"margin:0;color:#334155;font-size:14px;line-height:1.6;\">Thank you for shopping with us! " +
                "You can track the status of your order anytime from your account.</p>";
        sendHtmlEmail(to, "RefreshUp - Order " + orderId + " Confirmed", wrapHtml(name, content));
    }

    private void sendOtpEmail(String to, String name, String otp, String subject, String instruction) {
        String body = buildOtpHtml(name, otp, instruction);
        sendHtmlEmail(to, subject, body);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            logger.info("Email '{}' sent to {}", subject, to);
        } catch (MailAuthenticationException ex) {
            // Wrong/expired username or app password, or 2FA not enabled for app passwords.
            logger.error("SMTP authentication failed sending '{}' to {}. " +
                    "Verify MAIL_USERNAME / MAIL_PASSWORD (Gmail app password) and that 2FA is enabled.", subject, to, ex);
            throw new EmailSendException(
                    "Authentication Failed: Invalid SMTP credentials. Check the configured Gmail address and app password.");
        } catch (MailSendException ex) {
            // SMTP connect failure, STARTTLS negotiation failure, or 5xx/4xx response from the server.
            logger.error("SMTP delivery failed sending '{}' to {}. Full exception follows.", subject, to, ex);
            throw new EmailSendException("Email Sending Failed: " + describeSmtpError(ex));
        } catch (MailException | jakarta.mail.MessagingException ex) {
            logger.error("Email sending failed for '{}' to {}. Full exception follows.", subject, to, ex);
            throw new EmailSendException("Email Sending Failed: " + describeSmtpError(ex));
        } catch (Exception ex) {
            // Never log the OTP itself; the message body is not part of the log.
            logger.error("Unexpected error while sending '{}' to {}. Full exception follows.", subject, to, ex);
            throw new EmailSendException("Email Sending Failed: Network or server error. Please try again.");
        }
    }

    /**
     * Extracts a concise, human-readable reason from a Spring mail exception while
     * keeping the exact SMTP server response (e.g. the 535 authentication error).
     */
    private String describeSmtpError(Exception ex) {
        String message = ex.getMessage();
        if (message == null || message.trim().isEmpty()) {
            return "Unknown SMTP error. Check the server logs for details.";
        }
        message = message.trim();
        // Trim long nested chains but keep the meaningful tail (server response).
        if (message.length() > 500) {
            message = message.substring(0, 500) + "...";
        }
        return message;
    }

    private String buildOtpHtml(String name, String otp, String instruction) {
        String content =
                "<p style=\"margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;\">" +
                "Your verification code is:</p>" +
                "<div style=\"margin:0 0 20px;padding:16px;background-color:#ecfdf5;border:1px solid #d1fae5;border-radius:8px;text-align:center;\">" +
                "<span style=\"font-size:30px;font-weight:700;letter-spacing:8px;color:#047857;\">" + escapeHtml(otp) + "</span>" +
                "</div>" +
                "<p style=\"margin:0 0 16px;color:#334155;font-size:14px;line-height:1.6;\">" +
                "Use this code " + escapeHtml(instruction) + " It expires in <strong>5 minutes</strong> and can be used only once.</p>" +
                "<p style=\"margin:0;color:#64748b;font-size:13px;line-height:1.6;\">" +
                "If you did not request this code, you can safely ignore this email. Please do not share this code with anyone.</p>";
        return wrapHtml(name, content);
    }

    private String buildConfirmationHtml(String name, String message, String detail) {
        String content =
                "<div style=\"margin:0 0 20px;padding:16px;background-color:#ecfdf5;border:1px solid #d1fae5;border-radius:8px;\">" +
                "<p style=\"margin:0;color:#047857;font-size:15px;font-weight:700;line-height:1.6;\">" + escapeHtml(message) + "</p>" +
                "</div>" +
                "<p style=\"margin:0;color:#334155;font-size:14px;line-height:1.6;\">" + escapeHtml(detail) + "</p>";
        return wrapHtml(name, content);
    }

    private String wrapHtml(String name, String contentBlock) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<body style=\"margin:0;padding:0;background-color:#f4f7f6;font-family:Arial,Helvetica,sans-serif;\">" +
                "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background-color:#f4f7f6;padding:32px 16px;\">" +
                "<tr><td align=\"center\">" +
                "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);\">" +
                "<tr><td style=\"background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:28px 32px;text-align:center;\">" +
                "<h1 style=\"margin:0;color:#ffffff;font-size:24px;\">Refresh<span style=\"color:#d1fae5;\">Up</span></h1>" +
                "</td></tr>" +
                "<tr><td style=\"padding:32px;\">" +
                "<p style=\"margin:0 0 16px;color:#0f172a;font-size:16px;\">Hello <strong>" + escapeHtml(name) + "</strong>,</p>" +
                contentBlock +
                "</td></tr>" +
                "<tr><td style=\"padding:16px 32px;background-color:#f8fafc;text-align:center;color:#94a3b8;font-size:12px;\">" +
                "&copy; 2026 RefreshUp. All rights reserved.</td></tr>" +
                "</table></td></tr></table>" +
                "</body></html>";
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
