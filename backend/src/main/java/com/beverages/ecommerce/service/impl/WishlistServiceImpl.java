package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.dto.ApiResponse;
import com.beverages.ecommerce.dto.WishlistDTO;
import com.beverages.ecommerce.entity.Product;
import com.beverages.ecommerce.entity.User;
import com.beverages.ecommerce.entity.Wishlist;
import com.beverages.ecommerce.repository.ProductRepository;
import com.beverages.ecommerce.repository.UserRepository;
import com.beverages.ecommerce.repository.WishlistRepository;
import com.beverages.ecommerce.service.WishlistService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public WishlistServiceImpl(WishlistRepository wishlistRepository,
                               ProductRepository productRepository,
                               UserRepository userRepository) {
        this.wishlistRepository = wishlistRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    private WishlistDTO convertToDTO(Wishlist wishlist) {
        return WishlistDTO.builder()
                .wishlistId(wishlist.getWishlistId())
                .productId(wishlist.getProduct().getProductId())
                .productName(wishlist.getProduct().getProductName())
                .productBrand(wishlist.getProduct().getBrand())
                .productPrice(wishlist.getProduct().getPrice().doubleValue())
                .productImageUrl(wishlist.getProduct().getImageUrl())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WishlistDTO> getUserWishlist(Long userId) {
        return wishlistRepository.findByUserUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WishlistDTO addToWishlist(Long userId, Long productId) {
        if (wishlistRepository.existsByUserUserIdAndProductProductId(userId, productId)) {
            Wishlist existing = wishlistRepository.findByUserUserIdAndProductProductId(userId, productId)
                    .orElseThrow(() -> new RuntimeException("Wishlist item not found"));
            return convertToDTO(existing);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Wishlist wishlist = Wishlist.builder()
                .user(user)
                .product(product)
                .build();

        Wishlist saved = wishlistRepository.save(wishlist);
        return convertToDTO(saved);
    }

    @Override
    @Transactional
    public ApiResponse removeFromWishlist(Long userId, Long productId) {
        Wishlist wishlist = wishlistRepository.findByUserUserIdAndProductProductId(userId, productId)
                .orElseThrow(() -> new RuntimeException("Wishlist item not found"));

        wishlistRepository.delete(wishlist);
        return ApiResponse.builder().success(true).message("Removed from wishlist").build();
    }
}
