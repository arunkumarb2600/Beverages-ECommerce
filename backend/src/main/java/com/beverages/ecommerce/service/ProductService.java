package com.beverages.ecommerce.service;

import com.beverages.ecommerce.dto.ProductDTO;
import com.beverages.ecommerce.dto.ProductPageResponse;
import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    
    List<ProductDTO> getAllProducts();
    
    ProductDTO getProductById(Long id);
    
    List<ProductDTO> getProductsByCategory(Long categoryId);

    List<ProductDTO> getProductsByMainCategory(Long categoryId);
    
    ProductDTO createProduct(ProductDTO productDTO);
    
    ProductDTO updateProduct(Long id, ProductDTO productDTO);
    
    void deleteProduct(Long id);

    List<ProductDTO> getFeaturedProducts();

    List<ProductDTO> getNewArrivals();

    List<ProductDTO> getBestSellers();

    List<ProductDTO> getTrending();

    List<ProductDTO> getOfferProducts();

    List<String> getDistinctBrands();

    List<ProductDTO> searchProducts(String query);

    ProductPageResponse filterProducts(Long categoryId, BigDecimal minPrice, BigDecimal maxPrice, String brand, Boolean inStock, String search, int page, int size, String sortBy, String sortDir);
}
