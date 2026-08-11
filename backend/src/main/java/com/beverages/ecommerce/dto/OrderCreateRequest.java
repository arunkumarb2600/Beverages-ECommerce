package com.beverages.ecommerce.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderCreateRequest {

    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItemCreateRequest> items;

    // Payment method: "COD" (Cash On Delivery) or "RAZORPAY". Defaults to "RAZORPAY".
    private String paymentMethod;
}
