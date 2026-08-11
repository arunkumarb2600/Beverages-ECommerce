package com.beverages.ecommerce.repository;

import com.beverages.ecommerce.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    List<Product> findByCategoryCategoryId(Long categoryId);

    boolean existsByCategoryCategoryId(Long categoryId);
    
    List<Product> findByIsFeaturedTrue();

    List<Product> findByProductNameContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrBrandContainingIgnoreCase(String name, String desc, String brand);

    @Query("SELECT p FROM Product p WHERE p.category.categoryId IN " +
           "(SELECT c.categoryId FROM Category c WHERE c.parentId = :categoryId)")
    List<Product> findProductsByMainCategory(@Param("categoryId") Long categoryId);

    List<Product> findTop12ByOrderByCreatedAtDesc();

    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.brand IS NOT NULL AND p.brand <> '' ORDER BY p.brand")
    List<String> findDistinctBrands();

    @Query("SELECT p FROM Product p LEFT JOIN Category parent ON parent.categoryId = p.category.parentId WHERE " +
           "(:categoryId IS NULL OR p.category.categoryId = :categoryId OR " +
           " p.category.categoryId IN (SELECT c.categoryId FROM Category c WHERE c.parentId = :categoryId)) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:brand IS NULL OR LOWER(p.brand) = LOWER(:brand)) AND " +
           "(:inStock IS NULL OR :inStock = FALSE OR p.stock > 0) AND " +
           "(:search IS NULL OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.brand) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.category.categoryName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(parent.categoryName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> filterProducts(
            @Param("categoryId") Long categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("brand") String brand,
            @Param("inStock") Boolean inStock,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT p FROM Product p LEFT JOIN Category parent ON parent.categoryId = p.category.parentId WHERE " +
           "(:categoryId IS NULL OR p.category.categoryId = :categoryId OR " +
           " p.category.categoryId IN (SELECT c.categoryId FROM Category c WHERE c.parentId = :categoryId)) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:brand IS NULL OR LOWER(p.brand) = LOWER(:brand)) AND " +
           "(:inStock IS NULL OR :inStock = FALSE OR p.stock > 0) AND " +
           "(:search IS NULL OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.brand) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.category.categoryName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(parent.categoryName) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Product> filterProductList(
            @Param("categoryId") Long categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("brand") String brand,
            @Param("inStock") Boolean inStock,
            @Param("search") String search
    );
}
