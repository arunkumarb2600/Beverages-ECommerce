package com.beverages.ecommerce.repository;

import com.beverages.ecommerce.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByUserUserId(Long userId);
    Optional<Wishlist> findByUserUserIdAndProductProductId(Long userId, Long productId);
    boolean existsByUserUserIdAndProductProductId(Long userId, Long productId);
}
