package com.beverages.ecommerce.service;

import com.beverages.ecommerce.dto.*;

public interface AuthenticationService {
    
    ApiResponse register(RegisterRequest request);
    
    LoginResponse login(LoginRequest request);
    
    ApiResponse verifyAccount(VerifyAccountRequest request);
    
    ApiResponse forgetPassword(ForgotPasswordRequest request);
    
    ApiResponse verifyOtp(VerifyOtpRequest request);
    
    ApiResponse resetPassword(ResetPasswordRequest request);
    
    ApiResponse resendOtp(String email);

    ApiResponse logout(String token);
}
