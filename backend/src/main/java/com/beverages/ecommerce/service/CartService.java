package com.beverages.ecommerce.service;

import com.beverages.ecommerce.dto.CartDTO;
import com.beverages.ecommerce.dto.CartItemRequest;

public interface CartService {
    
    CartDTO getOrCreateCart(Long userId);
    
    CartDTO addItemToCart(Long userId, CartItemRequest request);
    
    CartDTO updateItemQuantity(Long userId, Long itemId, int quantity);
    
    CartDTO removeItemFromCart(Long userId, Long itemId);
    
    void clearCart(Long userId);
}
