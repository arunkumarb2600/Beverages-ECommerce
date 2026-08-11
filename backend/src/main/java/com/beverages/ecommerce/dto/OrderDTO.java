package com.beverages.ecommerce.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDTO {
    private Long orderId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String status;
    private BigDecimal total;
    private LocalDateTime createdAt;
    private String paymentStatus;
    private String paymentMethod;
    private List<OrderItemDTO> items;
}
