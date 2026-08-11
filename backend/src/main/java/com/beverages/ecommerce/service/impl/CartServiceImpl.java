package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.dto.CartDTO;
import com.beverages.ecommerce.dto.CartItemDTO;
import com.beverages.ecommerce.dto.CartItemRequest;
import com.beverages.ecommerce.entity.Cart;
import com.beverages.ecommerce.entity.CartItem;
import com.beverages.ecommerce.entity.Product;
import com.beverages.ecommerce.entity.User;
import com.beverages.ecommerce.exception.BadRequestException;
import com.beverages.ecommerce.exception.ResourceNotFoundException;
import com.beverages.ecommerce.repository.CartItemRepository;
import com.beverages.ecommerce.repository.CartRepository;
import com.beverages.ecommerce.repository.ProductRepository;
import com.beverages.ecommerce.repository.UserRepository;
import com.beverages.ecommerce.service.CartService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           ProductRepository productRepository,
                           UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public CartDTO getOrCreateCart(Long userId) {
        Cart cart = cartRepository.findByUserUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
                    Cart newCart = Cart.builder()
                            .user(user)
                            .cartItems(new ArrayList<>())
                            .build();
                    return cartRepository.save(newCart);
                });
        return mapToDTO(cart);
    }

    @Override
    @Transactional
    public CartDTO addItemToCart(Long userId, CartItemRequest request) {
        Cart cart = cartRepository.findByUserUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
                    Cart newCart = Cart.builder()
                            .user(user)
                            .cartItems(new ArrayList<>())
                            .build();
                    return cartRepository.save(newCart);
                });

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + request.getProductId()));

        if (product.getStock() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock for product " + product.getProductName() 
                    + ". Available stock: " + product.getStock());
        }

        // Look for existing item
        Optional<CartItem> existingItemOpt = cart.getCartItems().stream()
                .filter(item -> item.getProduct().getProductId().equals(product.getProductId()))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQty = existingItem.getQuantity() + request.getQuantity();
            if (product.getStock() < newQty) {
                throw new BadRequestException("Cannot add " + request.getQuantity() 
                        + " more units. Total quantity would exceed available stock (" + product.getStock() + ")");
            }
            existingItem.setQuantity(newQty);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cart.getCartItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        Cart updatedCart = cartRepository.save(cart);
        return mapToDTO(updatedCart);
    }

    @Override
    @Transactional
    public CartDTO updateItemQuantity(Long userId, Long itemId, int quantity) {
        if (quantity < 1) {
            throw new BadRequestException("Quantity must be at least 1");
        }

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with ID: " + itemId));

        Cart cart = item.getCart();
        if (!cart.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("Access denied: This cart item does not belong to you");
        }

        Product product = item.getProduct();
        if (product.getStock() < quantity) {
            throw new BadRequestException("Cannot update quantity to " + quantity 
                    + ". Available stock: " + product.getStock());
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);

        return mapToDTO(cart);
    }

    @Override
    @Transactional
    public CartDTO removeItemFromCart(Long userId, Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with ID: " + itemId));

        Cart cart = item.getCart();
        if (!cart.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("Access denied: This cart item does not belong to you");
        }

        cart.getCartItems().remove(item);
        cartItemRepository.delete(item);

        Cart updatedCart = cartRepository.save(cart);
        return mapToDTO(updatedCart);
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user: " + userId));

        cart.getCartItems().clear();
        cartRepository.save(cart);
    }

    private CartDTO mapToDTO(Cart cart) {
        List<CartItemDTO> itemDTOs = cart.getCartItems().stream()
                .map(item -> CartItemDTO.builder()
                        .cartItemId(item.getCartItemId())
                        .productId(item.getProduct().getProductId())
                        .productName(item.getProduct().getProductName())
                        .brand(item.getProduct().getBrand())
                        .imageUrl(item.getProduct().getImageUrl())
                        .price(item.getProduct().getPrice())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        return CartDTO.builder()
                .cartId(cart.getCartId())
                .userId(cart.getUser().getUserId())
                .items(itemDTOs)
                .build();
    }
}
