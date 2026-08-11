package com.beverages.ecommerce.controller;

import com.beverages.ecommerce.dto.AddressDTO;
import com.beverages.ecommerce.dto.ApiResponse;
import com.beverages.ecommerce.security.CustomUserDetails;
import com.beverages.ecommerce.service.AddressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public ResponseEntity<List<AddressDTO>> getUserAddresses(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<AddressDTO> addresses = addressService.getUserAddresses(userDetails.getId());
        return ResponseEntity.ok(addresses);
    }

    @PostMapping
    public ResponseEntity<AddressDTO> addAddress(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                 @RequestBody AddressDTO addressDTO) {
        AddressDTO created = addressService.addAddress(userDetails.getId(), addressDTO);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<AddressDTO> updateAddress(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                    @PathVariable Long addressId,
                                                    @RequestBody AddressDTO addressDTO) {
        AddressDTO updated = addressService.updateAddress(userDetails.getId(), addressId, addressDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<ApiResponse> deleteAddress(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                     @PathVariable Long addressId) {
        ApiResponse response = addressService.deleteAddress(userDetails.getId(), addressId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{addressId}/default")
    public ResponseEntity<AddressDTO> setDefaultAddress(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                         @PathVariable Long addressId) {
        AddressDTO updated = addressService.setDefaultAddress(userDetails.getId(), addressId);
        return ResponseEntity.ok(updated);
    }
}
