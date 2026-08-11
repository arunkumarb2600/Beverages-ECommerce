package com.beverages.ecommerce.controller;

import com.beverages.ecommerce.dto.OrderCreateRequest;
import com.beverages.ecommerce.dto.OrderDTO;
import com.beverages.ecommerce.dto.UpdateOrderStatusRequest;
import com.beverages.ecommerce.security.CustomUserDetails;
import com.beverages.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderDTO> createOrder(@Valid @RequestBody OrderCreateRequest request,
                                                @AuthenticationPrincipal CustomUserDetails userDetails) {
        OrderDTO order = orderService.createOrder(request, userDetails.getId());
        return new ResponseEntity<>(order, HttpStatus.CREATED);
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long id,
                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        String role = userDetails.getUser().getRole();
        OrderDTO order = orderService.getOrderById(id, userDetails.getId(), role);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/orders/my")
    public ResponseEntity<List<OrderDTO>> getUserOrders(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<OrderDTO> orders = orderService.getUserOrders(userDetails.getId());
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/admin/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PutMapping("/admin/orders/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderDTO> updateOrderStatus(@PathVariable Long id,
                                                      @Valid @RequestBody UpdateOrderStatusRequest request) {
        OrderDTO updated = orderService.updateOrderStatus(id, request.getStatus());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/orders/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id,
                                            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String role = userDetails.getUser().getRole();
        orderService.deleteOrder(id, userDetails.getId(), role);
        return ResponseEntity.noContent().build();
    }
}
