package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.dto.AddressDTO;
import com.beverages.ecommerce.dto.ApiResponse;
import com.beverages.ecommerce.entity.Address;
import com.beverages.ecommerce.entity.User;
import com.beverages.ecommerce.repository.AddressRepository;
import com.beverages.ecommerce.repository.UserRepository;
import com.beverages.ecommerce.service.AddressService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressServiceImpl(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    private AddressDTO convertToDTO(Address address) {
        return AddressDTO.builder()
                .addressId(address.getAddressId())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .state(address.getState())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .isDefault(address.getIsDefault())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressDTO> getUserAddresses(Long userId) {
        return addressRepository.findByUserUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AddressDTO addAddress(Long userId, AddressDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(dto.getIsDefault())) {
            resetDefaultAddress(userId);
        }

        Address address = Address.builder()
                .user(user)
                .addressLine1(dto.getAddressLine1())
                .addressLine2(dto.getAddressLine2())
                .city(dto.getCity())
                .state(dto.getState())
                .postalCode(dto.getPostalCode())
                .country(dto.getCountry())
                .isDefault(dto.getIsDefault() != null ? dto.getIsDefault() : false)
                .build();

        Address saved = addressRepository.save(address);
        return convertToDTO(saved);
    }

    @Override
    @Transactional
    public AddressDTO updateAddress(Long userId, Long addressId, AddressDTO dto) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        if (Boolean.TRUE.equals(dto.getIsDefault())) {
            resetDefaultAddress(userId);
        }

        address.setAddressLine1(dto.getAddressLine1());
        address.setAddressLine2(dto.getAddressLine2());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setPostalCode(dto.getPostalCode());
        address.setCountry(dto.getCountry());
        address.setIsDefault(dto.getIsDefault() != null ? dto.getIsDefault() : address.getIsDefault());

        Address saved = addressRepository.save(address);
        return convertToDTO(saved);
    }

    @Override
    @Transactional
    public ApiResponse deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        addressRepository.delete(address);
        return ApiResponse.builder().success(true).message("Address deleted successfully").build();
    }

    @Override
    @Transactional
    public AddressDTO setDefaultAddress(Long userId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        resetDefaultAddress(userId);
        address.setIsDefault(true);
        Address saved = addressRepository.save(address);
        return convertToDTO(saved);
    }

    private void resetDefaultAddress(Long userId) {
        List<Address> addresses = addressRepository.findByUserUserId(userId);
        for (Address addr : addresses) {
            if (Boolean.TRUE.equals(addr.getIsDefault())) {
                addr.setIsDefault(false);
                addressRepository.save(addr);
            }
        }
    }
}
