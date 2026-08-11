package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.dto.CategoryDTO;
import com.beverages.ecommerce.entity.Category;
import com.beverages.ecommerce.exception.BadRequestException;
import com.beverages.ecommerce.exception.ResourceNotFoundException;
import com.beverages.ecommerce.repository.CategoryRepository;
import com.beverages.ecommerce.repository.ProductRepository;
import com.beverages.ecommerce.service.CategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository,
                               ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));
        return mapToDTO(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getSubcategories(Long parentId) {
        if (!categoryRepository.existsById(parentId)) {
            throw new ResourceNotFoundException("Category not found with ID: " + parentId);
        }
        return categoryRepository.findByParentId(parentId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        validateCategory(categoryDTO, null);

        Category category = Category.builder()
                .categoryName(categoryDTO.getCategoryName().trim())
                .parentId(categoryDTO.getParentId())
                .build();
        Category saved = categoryRepository.save(category);
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public CategoryDTO updateCategory(Long id, CategoryDTO categoryDTO) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        validateCategory(categoryDTO, id);

        category.setCategoryName(categoryDTO.getCategoryName().trim());
        category.setParentId(categoryDTO.getParentId());

        Category updated = categoryRepository.save(category);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        if (productRepository.existsByCategoryCategoryId(id)) {
            throw new BadRequestException(
                    "Category '" + category.getCategoryName() + "' still has products. Move or delete its products first.");
        }
        if (categoryRepository.countByParentId(id) > 0) {
            throw new BadRequestException(
                    "Category '" + category.getCategoryName() + "' still has sub-categories. Delete them first.");
        }

        categoryRepository.delete(category);
    }

    private void validateCategory(CategoryDTO categoryDTO, Long currentId) {
        String rawName = categoryDTO.getCategoryName();
        if (rawName == null || rawName.trim().isEmpty()) {
            throw new BadRequestException("Category name is required");
        }
        final String name = rawName.trim();

        boolean duplicate;
        if (currentId == null) {
            duplicate = categoryRepository.existsByCategoryNameIgnoreCase(name);
        } else {
            final Long existingId = currentId;
            duplicate = categoryRepository.existsByCategoryNameIgnoreCase(name)
                    && !categoryRepository.findById(existingId)
                        .map(c -> c.getCategoryName().equalsIgnoreCase(name))
                        .orElse(false);
        }
        if (duplicate) {
            throw new BadRequestException("A category with the name '" + name + "' already exists");
        }

        Long parentId = categoryDTO.getParentId();
        if (parentId != null) {
            if (parentId.equals(currentId)) {
                throw new BadRequestException("A category cannot be its own parent");
            }
            if (!categoryRepository.existsById(parentId)) {
                throw new BadRequestException("Parent category not found with ID: " + parentId);
            }
        }
    }

    private CategoryDTO mapToDTO(Category category) {
        return CategoryDTO.builder()
                .categoryId(category.getCategoryId())
                .categoryName(category.getCategoryName())
                .parentId(category.getParentId())
                .build();
    }
}
