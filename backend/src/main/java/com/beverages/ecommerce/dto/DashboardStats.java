package com.beverages.ecommerce.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStats {
    private long totalProducts;
    private long totalCategories;
    private long totalUsers;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long pendingOrders;
    private long completedOrders;
    private long cancelledOrders;
    private BigDecimal todayRevenue;
    private BigDecimal monthlyRevenue;
    private BigDecimal yearlyRevenue;
}
