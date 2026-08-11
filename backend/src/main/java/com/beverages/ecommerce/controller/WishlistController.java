package com.beverages.ecommerce.controller;

import com.beverages.ecommerce.dto.ApiResponse;
import com.beverages.ecommerce.dto.WishlistDTO;
import com.beverages.ecommerce.security.CustomUserDetails;
import com.beverages.ecommerce.service.WishlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public ResponseEntity<List<WishlistDTO>> getUserWishlist(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<WishlistDTO> wishlist = wishlistService.getUserWishlist(userDetails.getId());
        return ResponseEntity.ok(wishlist);
    }

    @PostMapping("/add/{productId}")
    public ResponseEntity<WishlistDTO> addToWishlist(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                     @PathVariable Long productId) {
        WishlistDTO created = wishlistService.addToWishlist(userDetails.getId(), productId);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<ApiResponse> removeFromWishlist(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                          @PathVariable Long productId) {
        ApiResponse response = wishlistService.removeFromWishlist(userDetails.getId(), productId);
        return ResponseEntity.ok(response);
    }
}
