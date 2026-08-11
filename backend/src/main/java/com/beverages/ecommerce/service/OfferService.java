package com.beverages.ecommerce.service;

import com.beverages.ecommerce.dto.OfferDTO;
import java.util.List;

public interface OfferService {
    List<OfferDTO> getActiveOffers();
}
