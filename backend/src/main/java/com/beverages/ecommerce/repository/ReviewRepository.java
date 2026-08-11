package com.beverages.ecommerce.repository;

import com.beverages.ecommerce.entity.Review;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductProductId(Long productId);
    List<Review> findByUserUserId(Long userId);

    @Query("SELECT AVG(r.rating), COUNT(r) FROM Review r WHERE r.product.productId = :productId")
    List<Object[]> findRatingSummary(@Param("productId") Long productId);

    @Query("SELECT r FROM Review r ORDER BY r.createdAt DESC")
    List<Review> findRecentReviews(Pageable pageable);
}
