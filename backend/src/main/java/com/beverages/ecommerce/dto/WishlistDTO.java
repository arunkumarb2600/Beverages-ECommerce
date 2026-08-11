package com.beverages.ecommerce.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistDTO {
    private Long wishlistId;
    private Long productId;
    private String productName;
    private String productBrand;
    private Double productPrice;
    private String productImageUrl;
}
