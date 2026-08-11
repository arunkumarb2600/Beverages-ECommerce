package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.dto.ApiResponse;
import com.beverages.ecommerce.dto.NotificationDTO;
import com.beverages.ecommerce.entity.Notification;
import com.beverages.ecommerce.entity.User;
import com.beverages.ecommerce.repository.NotificationRepository;
import com.beverages.ecommerce.repository.UserRepository;
import com.beverages.ecommerce.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    private NotificationDTO convertToDTO(Notification notification) {
        return NotificationDTO.builder()
                .notificationId(notification.getNotificationId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDTO> getUserNotifications(Long userId, boolean unreadOnly) {
        List<Notification> list = unreadOnly 
                ? notificationRepository.findByUserUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                : notificationRepository.findByUserUserIdOrderByCreatedAtDesc(userId);
        return list.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ApiResponse markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
        return ApiResponse.builder().success(true).message("Marked as read").build();
    }

    @Override
    @Transactional
    public ApiResponse markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        for (Notification notif : unread) {
            notif.setIsRead(true);
            notificationRepository.save(notif);
        }
        return ApiResponse.builder().success(true).message("All marked as read").build();
    }

    @Override
    @Transactional
    public void sendNotification(Long userId, String title, String message) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            Notification notification = Notification.builder()
                    .user(user)
                    .title(title)
                    .message(message)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }
    }
}
