package com.beverages.ecommerce.repository;

import com.beverages.ecommerce.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findAllByOrderByCreatedAtDesc();

    long countByStatus(String status);

    long countByStatusIn(List<String> statuses);

    long countByStatusNotIn(List<String> statuses);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.status IN :statuses")
    BigDecimal sumTotalByStatusIn(@Param("statuses") List<String> statuses);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.status IN :statuses AND o.createdAt >= :since")
    BigDecimal sumTotalByStatusInSince(@Param("statuses") List<String> statuses, @Param("since") LocalDateTime since);
}
