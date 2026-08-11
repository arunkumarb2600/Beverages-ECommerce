package com.beverages.ecommerce.service;

import com.beverages.ecommerce.dto.ApiResponse;
import com.beverages.ecommerce.dto.NotificationDTO;
import java.util.List;

public interface NotificationService {
    List<NotificationDTO> getUserNotifications(Long userId, boolean unreadOnly);
    ApiResponse markAsRead(Long userId, Long notificationId);
    ApiResponse markAllAsRead(Long userId);
    void sendNotification(Long userId, String title, String message);
}
