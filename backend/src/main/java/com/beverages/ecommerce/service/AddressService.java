package com.beverages.ecommerce.service;

import com.beverages.ecommerce.dto.AddressDTO;
import com.beverages.ecommerce.dto.ApiResponse;
import java.util.List;

public interface AddressService {
    List<AddressDTO> getUserAddresses(Long userId);
    AddressDTO addAddress(Long userId, AddressDTO addressDTO);
    AddressDTO updateAddress(Long userId, Long addressId, AddressDTO addressDTO);
    ApiResponse deleteAddress(Long userId, Long addressId);
    AddressDTO setDefaultAddress(Long userId, Long addressId);
}
