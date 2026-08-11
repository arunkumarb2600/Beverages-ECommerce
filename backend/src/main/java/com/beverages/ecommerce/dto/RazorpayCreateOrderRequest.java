package com.beverages.ecommerce.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayCreateOrderRequest {

    @NotNull(message = "Order id is required")
    private Long orderId;
}
