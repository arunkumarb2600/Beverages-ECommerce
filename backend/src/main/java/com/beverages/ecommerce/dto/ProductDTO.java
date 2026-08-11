package com.beverages.ecommerce.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDTO {
    private Long productId;
    private Long categoryId;
    private String categoryName;
    private String productName;
    private String brand;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private String imageUrl;
    private Boolean isFeatured;
    private LocalDateTime createdAt;
    private Double averageRating;
    private Integer reviewCount;
}
