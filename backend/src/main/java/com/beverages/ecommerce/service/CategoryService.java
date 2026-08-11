package com.beverages.ecommerce.service;

import com.beverages.ecommerce.dto.CategoryDTO;
import java.util.List;

public interface CategoryService {
    
    List<CategoryDTO> getAllCategories();
    
    CategoryDTO getCategoryById(Long id);
    
    List<CategoryDTO> getSubcategories(Long parentId);
    
    CategoryDTO createCategory(CategoryDTO categoryDTO);
    
    CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO);
    
    void deleteCategory(Long id);
}
