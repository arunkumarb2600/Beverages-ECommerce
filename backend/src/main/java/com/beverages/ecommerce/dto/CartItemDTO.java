package com.beverages.ecommerce.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemDTO {
    private Long cartItemId;
    private Long productId;
    private String productName;
    private String brand;
    private String imageUrl;
    private BigDecimal price;
    private Integer quantity;
}
