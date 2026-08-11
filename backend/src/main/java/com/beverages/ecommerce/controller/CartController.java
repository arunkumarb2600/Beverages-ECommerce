package com.beverages.ecommerce.controller;

import com.beverages.ecommerce.dto.CartDTO;
import com.beverages.ecommerce.dto.CartItemRequest;
import com.beverages.ecommerce.security.CustomUserDetails;
import com.beverages.ecommerce.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<CartDTO> getCart(@AuthenticationPrincipal CustomUserDetails userDetails) {
        CartDTO cart = cartService.getOrCreateCart(userDetails.getId());
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/items")
    public ResponseEntity<CartDTO> addItemToCart(@Valid @RequestBody CartItemRequest request,
                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        CartDTO cart = cartService.addItemToCart(userDetails.getId(), request);
        return ResponseEntity.ok(cart);
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartDTO> updateItemQuantity(@PathVariable Long itemId,
                                                      @RequestParam("quantity") int quantity,
                                                      @AuthenticationPrincipal CustomUserDetails userDetails) {
        CartDTO cart = cartService.updateItemQuantity(userDetails.getId(), itemId, quantity);
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartDTO> removeItemFromCart(@PathVariable Long itemId,
                                                      @AuthenticationPrincipal CustomUserDetails userDetails) {
        CartDTO cart = cartService.removeItemFromCart(userDetails.getId(), itemId);
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal CustomUserDetails userDetails) {
        cartService.clearCart(userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
