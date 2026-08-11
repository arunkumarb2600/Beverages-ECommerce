package com.beverages.ecommerce.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfferDTO {
    private Long offerId;
    private String title;
    private String subtitle;
    private String badge;
    private Integer discountPercent;
    private String gradientFrom;
    private String gradientTo;
    private Long categoryId;
    private String imageUrl;
    private Boolean isActive;
}
