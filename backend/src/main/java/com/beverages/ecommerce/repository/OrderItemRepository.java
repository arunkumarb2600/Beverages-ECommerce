package com.beverages.ecommerce.repository;

import com.beverages.ecommerce.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Best sellers: products ordered by total quantity across all orders
    @Query("SELECT oi.product.productId, SUM(oi.quantity) AS qty FROM OrderItem oi " +
           "GROUP BY oi.product.productId ORDER BY qty DESC")
    List<Object[]> findTopProductsByOrderedQuantity(Pageable pageable);

    // Trending: products ordered most within the last 30 days
    @Query("SELECT oi.product.productId, SUM(oi.quantity) AS qty FROM OrderItem oi " +
           "JOIN oi.order o WHERE o.createdAt >= :since " +
           "GROUP BY oi.product.productId ORDER BY qty DESC")
    List<Object[]> findTopProductsByRecentOrders(@Param("since") LocalDateTime since, Pageable pageable);
}
