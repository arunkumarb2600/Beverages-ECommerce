package com.beverages.ecommerce.controller;

import com.beverages.ecommerce.dto.ApiResponse;
import com.beverages.ecommerce.dto.ReviewDTO;
import com.beverages.ecommerce.security.CustomUserDetails;
import com.beverages.ecommerce.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewDTO>> getProductReviews(@PathVariable Long productId) {
        List<ReviewDTO> reviews = reviewService.getProductReviews(productId);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<ReviewDTO>> getRecentReviews(
            @RequestParam(value = "limit", defaultValue = "6") int limit) {
        return ResponseEntity.ok(reviewService.getRecentReviews(Math.min(Math.max(limit, 1), 20)));
    }

    @PostMapping
    public ResponseEntity<ReviewDTO> addReview(@AuthenticationPrincipal CustomUserDetails userDetails,
                                               @RequestBody ReviewDTO reviewDTO) {
        ReviewDTO created = reviewService.addReview(userDetails.getId(), reviewDTO);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse> deleteReview(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                    @PathVariable Long reviewId) {
        ApiResponse response = reviewService.deleteReview(userDetails.getId(), reviewId);
        return ResponseEntity.ok(response);
    }
}
