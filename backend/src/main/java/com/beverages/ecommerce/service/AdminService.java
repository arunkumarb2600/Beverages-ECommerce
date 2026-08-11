package com.beverages.ecommerce.service;

import com.beverages.ecommerce.dto.DashboardStats;
import com.beverages.ecommerce.dto.PaymentDTO;
import com.beverages.ecommerce.dto.UpdateUserRequest;
import com.beverages.ecommerce.dto.UserDTO;
import java.util.List;

public interface AdminService {

    DashboardStats getDashboardStats();

    List<UserDTO> getAllUsers(String search);

    UserDTO getUserById(Long userId);

    UserDTO updateUser(Long userId, UpdateUserRequest request);

    List<PaymentDTO> getAllPayments();
}
