package com.beverages.ecommerce.service;

import com.beverages.ecommerce.dto.ApiResponse;
import com.beverages.ecommerce.dto.WishlistDTO;
import java.util.List;

public interface WishlistService {
    List<WishlistDTO> getUserWishlist(Long userId);
    WishlistDTO addToWishlist(Long userId, Long productId);
    ApiResponse removeFromWishlist(Long userId, Long productId);
}
