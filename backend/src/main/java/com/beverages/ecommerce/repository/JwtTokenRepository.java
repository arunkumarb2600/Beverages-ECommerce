package com.beverages.ecommerce.repository;

import com.beverages.ecommerce.entity.JwtToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface JwtTokenRepository extends JpaRepository<JwtToken, Long> {
    Optional<JwtToken> findByToken(String token);
    List<JwtToken> findByUserUserIdAndIsExpiredFalseAndIsRevokedFalse(Long userId);
}
