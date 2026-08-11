package com.beverages.ecommerce.controller;

import com.beverages.ecommerce.dto.DashboardStats;
import com.beverages.ecommerce.dto.PaymentDTO;
import com.beverages.ecommerce.dto.UpdateUserRequest;
import com.beverages.ecommerce.dto.UserDTO;
import com.beverages.ecommerce.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin panel endpoints (dashboard, users, payments)")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Dashboard statistics",
            description = "Aggregate counts and revenue figures for the admin dashboard and analytics pages.")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/users")
    @Operation(summary = "List users", description = "Lists all users, optionally filtered by name or email search.")
    public ResponseEntity<List<UserDTO>> getUsers(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(adminService.getAllUsers(search));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Update user",
            description = "Update a user's name, phone, role or enabled flag. Only provided fields are updated.")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id,
                                              @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(id, request));
    }

    @GetMapping("/payments")
    @Operation(summary = "List payments", description = "Lists all payments, newest first. Read-only.")
    public ResponseEntity<List<PaymentDTO>> getPayments() {
        return ResponseEntity.ok(adminService.getAllPayments());
    }
}
