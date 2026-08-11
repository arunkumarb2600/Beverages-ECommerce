package com.beverages.ecommerce.service;

import com.beverages.ecommerce.dto.ApiResponse;
import com.beverages.ecommerce.dto.ReviewDTO;
import java.util.List;

public interface ReviewService {
    List<ReviewDTO> getProductReviews(Long productId);
    List<ReviewDTO> getRecentReviews(int limit);
    ReviewDTO addReview(Long userId, ReviewDTO reviewDTO);
    ApiResponse deleteReview(Long userId, Long reviewId);
}
