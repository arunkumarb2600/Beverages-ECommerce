package com.beverages.ecommerce.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemDTO {
    private Long orderItemId;
    private Long productId;
    private String productName;
    private String brand;
    private String imageUrl;
    private Integer quantity;
    private BigDecimal price;
}
