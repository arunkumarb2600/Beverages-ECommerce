package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.dto.ApiResponse;
import com.beverages.ecommerce.dto.ReviewDTO;
import com.beverages.ecommerce.entity.Product;
import com.beverages.ecommerce.entity.Review;
import com.beverages.ecommerce.entity.User;
import com.beverages.ecommerce.repository.ProductRepository;
import com.beverages.ecommerce.repository.ReviewRepository;
import com.beverages.ecommerce.repository.UserRepository;
import com.beverages.ecommerce.service.ReviewService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ReviewServiceImpl(ReviewRepository reviewRepository,
                             ProductRepository productRepository,
                             UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    private ReviewDTO convertToDTO(Review review) {
        return ReviewDTO.builder()
                .reviewId(review.getReviewId())
                .productId(review.getProduct().getProductId())
                .productName(review.getProduct().getProductName())
                .userId(review.getUser().getUserId())
                .userName(review.getUser().getName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDTO> getProductReviews(Long productId) {
        return reviewRepository.findByProductProductId(productId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewDTO> getRecentReviews(int limit) {
        return reviewRepository.findRecentReviews(PageRequest.of(0, limit)).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ReviewDTO addReview(Long userId, ReviewDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(dto.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(dto.getRating())
                .comment(dto.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        return convertToDTO(saved);
    }

    @Override
    @Transactional
    public ApiResponse deleteReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        reviewRepository.delete(review);
        return ApiResponse.builder().success(true).message("Review deleted successfully").build();
    }
}
