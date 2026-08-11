package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.dto.DashboardStats;
import com.beverages.ecommerce.dto.PaymentDTO;
import com.beverages.ecommerce.dto.UpdateUserRequest;
import com.beverages.ecommerce.dto.UserDTO;
import com.beverages.ecommerce.entity.Payment;
import com.beverages.ecommerce.entity.User;
import com.beverages.ecommerce.exception.BadRequestException;
import com.beverages.ecommerce.exception.ResourceNotFoundException;
import com.beverages.ecommerce.repository.CategoryRepository;
import com.beverages.ecommerce.repository.OrderRepository;
import com.beverages.ecommerce.repository.PaymentRepository;
import com.beverages.ecommerce.repository.ProductRepository;
import com.beverages.ecommerce.repository.UserRepository;
import com.beverages.ecommerce.service.AdminService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminServiceImpl implements AdminService {

    private static final Set<String> VALID_ROLES = Set.of("USER", "ADMIN");
    private static final List<String> REVENUE_STATUSES = List.of("DELIVERED", "COMPLETED");
    private static final List<String> TERMINAL_STATUSES = List.of("DELIVERED", "COMPLETED", "CANCELLED");

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    public AdminServiceImpl(ProductRepository productRepository,
                            CategoryRepository categoryRepository,
                            UserRepository userRepository,
                            OrderRepository orderRepository,
                            PaymentRepository paymentRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardStats getDashboardStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        return DashboardStats.builder()
                .totalProducts(productRepository.count())
                .totalCategories(categoryRepository.count())
                .totalUsers(userRepository.count())
                .totalOrders(orderRepository.count())
                .totalRevenue(orderRepository.sumTotalByStatusIn(REVENUE_STATUSES))
                .pendingOrders(orderRepository.countByStatusNotIn(TERMINAL_STATUSES))
                .completedOrders(orderRepository.countByStatusIn(REVENUE_STATUSES))
                .cancelledOrders(orderRepository.countByStatus("CANCELLED"))
                .todayRevenue(orderRepository.sumTotalByStatusInSince(REVENUE_STATUSES, today.atStartOfDay()))
                .monthlyRevenue(orderRepository.sumTotalByStatusInSince(REVENUE_STATUSES, today.withDayOfMonth(1).atStartOfDay()))
                .yearlyRevenue(orderRepository.sumTotalByStatusInSince(REVENUE_STATUSES, today.withDayOfYear(1).atStartOfDay()))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers(String search) {
        List<User> users;
        if (StringUtils.hasText(search)) {
            users = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByCreatedAtDesc(
                    search.trim(), search.trim());
        } else {
            users = userRepository.findAllByOrderByCreatedAtDesc();
        }
        return users.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        return mapToDTO(user);
    }

    @Override
    @Transactional
    public UserDTO updateUser(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (StringUtils.hasText(request.getName())) {
            if (request.getName().trim().length() < 2) {
                throw new BadRequestException("Name must be at least 2 characters long");
            }
            user.setName(request.getName().trim());
        }

        if (StringUtils.hasText(request.getPhone())) {
            user.setPhone(request.getPhone().trim());
        }

        if (StringUtils.hasText(request.getRole())) {
            String role = request.getRole().trim().toUpperCase();
            if (!VALID_ROLES.contains(role)) {
                throw new BadRequestException("Invalid role. Allowed roles: USER, ADMIN");
            }
            user.setRole(role);
        }

        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }

        User saved = userRepository.save(user);
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentDTO> getAllPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .isVerified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private PaymentDTO mapToDTO(Payment payment) {
        return PaymentDTO.builder()
                .paymentId(payment.getPaymentId())
                .orderId(payment.getOrder() != null ? payment.getOrder().getOrderId() : null)
                .userId(payment.getUserId())
                .razorpayOrderId(payment.getRazorpayOrderId())
                .razorpayPaymentId(payment.getRazorpayPaymentId())
                .razorpaySignature(payment.getRazorpaySignature())
                .transactionId(payment.getTransactionId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
