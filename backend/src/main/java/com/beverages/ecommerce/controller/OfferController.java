package com.beverages.ecommerce.controller;

import com.beverages.ecommerce.dto.OfferDTO;
import com.beverages.ecommerce.service.OfferService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class OfferController {

    private final OfferService offerService;

    public OfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @GetMapping("/offers")
    public ResponseEntity<List<OfferDTO>> getActiveOffers() {
        return ResponseEntity.ok(offerService.getActiveOffers());
    }
}
