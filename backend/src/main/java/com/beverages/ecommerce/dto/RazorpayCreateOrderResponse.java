package com.beverages.ecommerce.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayCreateOrderResponse {

    private String razorpayOrderId;
    private BigDecimal amount;
    private Long amountInPaise;
    private String currency;
    private String keyId;
}
