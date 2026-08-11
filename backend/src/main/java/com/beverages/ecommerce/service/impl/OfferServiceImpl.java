package com.beverages.ecommerce.service.impl;

import com.beverages.ecommerce.dto.OfferDTO;
import com.beverages.ecommerce.entity.Offer;
import com.beverages.ecommerce.repository.OfferRepository;
import com.beverages.ecommerce.service.OfferService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OfferServiceImpl implements OfferService {

    private final OfferRepository offerRepository;

    public OfferServiceImpl(OfferRepository offerRepository) {
        this.offerRepository = offerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OfferDTO> getActiveOffers() {
        return offerRepository.findByIsActiveTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private OfferDTO mapToDTO(Offer offer) {
        return OfferDTO.builder()
                .offerId(offer.getOfferId())
                .title(offer.getTitle())
                .subtitle(offer.getSubtitle())
                .badge(offer.getBadge())
                .discountPercent(offer.getDiscountPercent())
                .gradientFrom(offer.getGradientFrom())
                .gradientTo(offer.getGradientTo())
                .categoryId(offer.getCategoryId())
                .imageUrl(offer.getImageUrl())
                .isActive(offer.getIsActive())
                .build();
    }
}
