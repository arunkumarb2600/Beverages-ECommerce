package com.beverages.ecommerce.controller;

import com.beverages.ecommerce.dto.ApiResponse;
import com.beverages.ecommerce.dto.NotificationDTO;
import com.beverages.ecommerce.security.CustomUserDetails;
import com.beverages.ecommerce.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                                     @RequestParam(value = "unreadOnly", defaultValue = "false") boolean unreadOnly) {
        List<NotificationDTO> list = notificationService.getUserNotifications(userDetails.getId(), unreadOnly);
        return ResponseEntity.ok(list);
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse> markAsRead(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                  @PathVariable Long notificationId) {
        ApiResponse response = notificationService.markAsRead(userDetails.getId(), notificationId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse> markAllAsRead(@AuthenticationPrincipal CustomUserDetails userDetails) {
        ApiResponse response = notificationService.markAllAsRead(userDetails.getId());
        return ResponseEntity.ok(response);
    }
}
