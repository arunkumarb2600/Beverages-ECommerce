package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.dto.ProductDTO;
import com.beverages.ecommerce.dto.ProductPageResponse;
import com.beverages.ecommerce.entity.Category;
import com.beverages.ecommerce.entity.Offer;
import com.beverages.ecommerce.entity.Product;
import com.beverages.ecommerce.exception.ResourceNotFoundException;
import com.beverages.ecommerce.repository.CategoryRepository;
import com.beverages.ecommerce.repository.OfferRepository;
import com.beverages.ecommerce.repository.OrderItemRepository;
import com.beverages.ecommerce.repository.ProductRepository;
import com.beverages.ecommerce.repository.ReviewRepository;
import com.beverages.ecommerce.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final OrderItemRepository orderItemRepository;
    private final OfferRepository offerRepository;

    public ProductServiceImpl(ProductRepository productRepository,
                              CategoryRepository categoryRepository,
                              ReviewRepository reviewRepository,
                              OrderItemRepository orderItemRepository,
                              OfferRepository offerRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.reviewRepository = reviewRepository;
        this.orderItemRepository = orderItemRepository;
        this.offerRepository = offerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        return mapToDTO(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getProductsByCategory(Long categoryId) {
        // First verify category exists
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category not found with ID: " + categoryId);
        }
        return productRepository.findByCategoryCategoryId(categoryId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getProductsByMainCategory(Long categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category not found with ID: " + categoryId);
        }
        return productRepository.findProductsByMainCategory(categoryId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductDTO createProduct(ProductDTO productDTO) {
        Category category = categoryRepository.findById(productDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + productDTO.getCategoryId()));
        
        Product product = Product.builder()
                .productName(productDTO.getProductName())
                .brand(productDTO.getBrand())
                .description(productDTO.getDescription())
                .price(productDTO.getPrice())
                .stock(productDTO.getStock())
                .imageUrl(productDTO.getImageUrl())
                .isFeatured(productDTO.getIsFeatured() != null ? productDTO.getIsFeatured() : false)
                .category(category)
                .build();
        
        Product saved = productRepository.save(product);
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        
        Category category = categoryRepository.findById(productDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + productDTO.getCategoryId()));
        
        product.setProductName(productDTO.getProductName());
        product.setBrand(productDTO.getBrand());
        product.setDescription(productDTO.getDescription());
        product.setPrice(productDTO.getPrice());
        product.setStock(productDTO.getStock());
        product.setImageUrl(productDTO.getImageUrl());
        product.setIsFeatured(productDTO.getIsFeatured() != null ? productDTO.getIsFeatured() : false);
        product.setCategory(category);
        
        Product updated = productRepository.save(product);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        productRepository.delete(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getFeaturedProducts() {
        return productRepository.findByIsFeaturedTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getNewArrivals() {
        return productRepository.findTop12ByOrderByCreatedAtDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getBestSellers() {
        return getTopOrderedProducts(orderItemRepository.findTopProductsByOrderedQuantity(PageRequest.of(0, 12)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getTrending() {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        return getTopOrderedProducts(orderItemRepository.findTopProductsByRecentOrders(since, PageRequest.of(0, 12)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> getOfferProducts() {
        List<Offer> offers = offerRepository.findByIsActiveTrue();
        Set<Long> categoryIds = offers.stream()
                .map(Offer::getCategoryId)
                .filter(id -> id != null)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (categoryIds.isEmpty()) {
            // Fall back to newest products so the offers rail never looks empty
            return getNewArrivals();
        }

        List<ProductDTO> result = new ArrayList<>();
        Set<Long> seen = new LinkedHashSet<>();
        for (Long categoryId : categoryIds) {
            List<Product> products = productRepository.findByCategoryCategoryId(categoryId);
            if (products.isEmpty()) {
                // Main category → pull from its subcategories
                products = productRepository.findProductsByMainCategory(categoryId);
            }
            for (Product p : products) {
                if (seen.add(p.getProductId())) {
                    result.add(mapToDTO(p));
                }
                if (result.size() >= 12) {
                    break;
                }
            }
            if (result.size() >= 12) {
                break;
            }
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getDistinctBrands() {
        return productRepository.findDistinctBrands();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDTO> searchProducts(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllProducts();
        }
        return productRepository.findByProductNameContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrBrandContainingIgnoreCase(query, query, query)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductPageResponse filterProducts(Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, String brand, Boolean inStock, String search, int page, int size, String sortBy, String sortDir) {
        String searchParam = (search == null || search.trim().isEmpty()) ? null : search.trim();
        String brandParam = (brand == null || brand.trim().isEmpty()) ? null : brand.trim();
        boolean inStockParam = Boolean.TRUE.equals(inStock);

        // Popularity sort ranks products by total quantity ordered (best-seller style),
        // computed in memory to keep the SQL simple.
        if ("popularity".equalsIgnoreCase(sortBy)) {
            return filterProductsByPopularity(categoryId, minPrice, maxPrice, brandParam, inStockParam, searchParam, page, size);
        }

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.DESC.name())
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Product> productsPage = productRepository.filterProducts(categoryId, minPrice, maxPrice, brandParam, inStockParam, searchParam, pageable);
        List<ProductDTO> content = productsPage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ProductPageResponse.builder()
                .content(content)
                .pageNo(productsPage.getNumber())
                .pageSize(productsPage.getSize())
                .totalElements(productsPage.getTotalElements())
                .totalPages(productsPage.getTotalPages())
                .last(productsPage.isLast())
                .build();
    }

    private ProductPageResponse filterProductsByPopularity(Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, String brand, Boolean inStock, String search, int page, int size) {
        List<Product> all = productRepository.filterProductList(categoryId, minPrice, maxPrice, brand, inStock, search);

        Map<Long, Integer> rankById = new HashMap<>();
        int rank = 0;
        for (Object[] row : orderItemRepository.findTopProductsByOrderedQuantity(PageRequest.of(0, 1000))) {
            Number id = (Number) row[0];
            if (id != null) {
                rankById.putIfAbsent(id.longValue(), rank++);
            }
        }

        all.sort((a, b) -> {
            Integer ra = rankById.get(a.getProductId());
            Integer rb = rankById.get(b.getProductId());
            if (ra != null && rb != null) return ra.compareTo(rb);
            if (ra != null) return -1;
            if (rb != null) return 1;
            return a.getProductName().compareToIgnoreCase(b.getProductName());
        });

        int total = all.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int from = Math.min(page * size, total);
        int to = Math.min(from + size, total);
        List<ProductDTO> content = all.subList(from, to).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return ProductPageResponse.builder()
                .content(content)
                .pageNo(page)
                .pageSize(size)
                .totalElements(total)
                .totalPages(totalPages)
                .last(page >= totalPages - 1)
                .build();
    }

    // Resolve product ids from aggregated order queries, preserving order and skipping deleted products
    private List<ProductDTO> getTopOrderedProducts(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) {
            return getFeaturedProducts();
        }
        List<ProductDTO> result = new ArrayList<>();
        Set<Long> seen = new LinkedHashSet<>();
        for (Object[] row : rows) {
            Number id = (Number) row[0];
            if (id == null || !seen.add(id.longValue())) {
                continue;
            }
            productRepository.findById(id.longValue()).ifPresent(p -> result.add(mapToDTO(p)));
        }
        return result;
    }

    private ProductDTO mapToDTO(Product product) {
        List<Object[]> stats = reviewRepository.findRatingSummary(product.getProductId());
        Double average = null;
        Integer count = 0;
        if (stats != null && !stats.isEmpty() && stats.get(0)[0] != null) {
            average = ((Number) stats.get(0)[0]).doubleValue();
            count = stats.get(0)[1] != null ? ((Number) stats.get(0)[1]).intValue() : 0;
        }
        return ProductDTO.builder()
                .productId(product.getProductId())
                .categoryId(product.getCategory().getCategoryId())
                .categoryName(product.getCategory().getCategoryName())
                .productName(product.getProductName())
                .brand(product.getBrand())
                .description(product.getDescription())
                .price(product.getPrice())
                .stock(product.getStock())
                .imageUrl(product.getImageUrl())
                .isFeatured(product.getIsFeatured())
                .createdAt(product.getCreatedAt())
                .averageRating(average)
                .reviewCount(count)
                .build();
    }
}
