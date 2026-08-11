package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.dto.*;
import com.beverages.ecommerce.entity.User;
import com.beverages.ecommerce.entity.Role;
import com.beverages.ecommerce.entity.JwtToken;
import com.beverages.ecommerce.exception.*;
import com.beverages.ecommerce.repository.UserRepository;
import com.beverages.ecommerce.repository.RoleRepository;
import com.beverages.ecommerce.repository.JwtTokenRepository;
import com.beverages.ecommerce.security.CustomUserDetails;
import com.beverages.ecommerce.security.JwtService;
import com.beverages.ecommerce.service.AuthenticationService;
import com.beverages.ecommerce.service.EmailService;
import com.beverages.ecommerce.service.OtpService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationServiceImpl implements AuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationServiceImpl.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtTokenRepository jwtTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final EmailService emailService;

    public AuthenticationServiceImpl(UserRepository userRepository,
                                     RoleRepository roleRepository,
                                     JwtTokenRepository jwtTokenRepository,
                                     PasswordEncoder passwordEncoder,
                                     AuthenticationManager authenticationManager,
                                     JwtService jwtService,
                                     OtpService otpService,
                                     EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.jwtTokenRepository = jwtTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public ApiResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email address is already in use");
        }

        // New registrations are always standard users. Admin accounts are created
        // by an administrator or inserted directly into the database.
        Role role = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_USER").build()));

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .isVerified(false)
                .build();

        user.getRoles().add(role);
        userRepository.save(user);

        String otp = otpService.issueOtp(user, false);
        userRepository.save(user);
        emailService.sendRegistrationOtp(user.getEmail(), user.getName(), otp);

        return ApiResponse.builder()
                .success(true)
                .message("Registration successful! Please verify your account with the OTP sent to your email.")
                .build();
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userDetails.getUser();

            if (!user.isVerified()) {
                throw new AccountNotVerifiedException(
                        "Account is not verified. Please verify your account before logging in.");
            }

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = request.isRememberMe()
                    ? jwtService.generateToken(authentication, jwtService.getRememberMeExpirationInMs())
                    : jwtService.generateToken(authentication);

            JwtToken jwtToken = JwtToken.builder()
                    .user(user)
                    .token(jwt)
                    .isRevoked(false)
                    .isExpired(false)
                    .build();
            jwtTokenRepository.save(jwtToken);

            return LoginResponse.builder()
                    .token(jwt)
                    .role(user.getRole())
                    .name(user.getName())
                    .build();
        } catch (DisabledException ex) {
            throw new InvalidCredentialsException("Your account has been disabled by the administrator. Please contact support.");
        } catch (BadCredentialsException ex) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
    }

    @Override
    @Transactional
    public ApiResponse verifyAccount(VerifyAccountRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.getEmail()));

        if (user.isVerified()) {
            return ApiResponse.builder()
                    .success(true)
                    .message("Account is already verified.")
                    .build();
        }

        otpService.validateOtp(user, request.getOtp());
        user.setVerified(true);
        otpService.clearOtp(user);
        userRepository.save(user);
        emailService.sendVerificationConfirmation(user.getEmail(), user.getName());

        return ApiResponse.builder()
                .success(true)
                .message("Account verified successfully! You can now log in.")
                .build();
    }

    @Override
    @Transactional
    public ApiResponse forgetPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.getEmail()));

        String otp = otpService.issueOtp(user, false);
        userRepository.save(user);
        emailService.sendPasswordResetOtp(user.getEmail(), user.getName(), otp);

        return ApiResponse.builder()
                .success(true)
                .message("Reset OTP sent successfully to your email.")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.getEmail()));

        otpService.validateOtp(user, request.getOtp());

        return ApiResponse.builder()
                .success(true)
                .message("OTP verified successfully.")
                .build();
    }

    @Override
    @Transactional
    public ApiResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.getEmail()));

        otpService.validateOtp(user, request.getOtp());
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        otpService.clearOtp(user);
        userRepository.save(user);
        emailService.sendPasswordResetConfirmation(user.getEmail(), user.getName());

        return ApiResponse.builder()
                .success(true)
                .message("Password reset successfully! You can now log in with your new password.")
                .build();
    }

    @Override
    @Transactional
    public ApiResponse resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));

        String otp = otpService.issueOtp(user, true);
        userRepository.save(user);
        emailService.sendResentOtp(user.getEmail(), user.getName(), otp);

        return ApiResponse.builder()
                .success(true)
                .message("A new OTP has been generated and sent to your email.")
                .build();
    }

    @Override
    @Transactional
    public ApiResponse logout(String token) {
        jwtTokenRepository.findByToken(token).ifPresent(t -> {
            t.setIsRevoked(true);
            t.setIsExpired(true);
            jwtTokenRepository.save(t);
        });
        return ApiResponse.builder()
                .success(true)
                .message("Logged out successfully!")
                .build();
    }
}
