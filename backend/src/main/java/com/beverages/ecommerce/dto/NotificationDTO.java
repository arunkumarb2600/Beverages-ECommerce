package com.beverages.ecommerce.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private Long notificationId;
    private String title;
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
