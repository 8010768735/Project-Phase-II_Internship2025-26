package com.coffee.controller;


import org.springframework.web.bind.annotation.*;

import com.coffee.entity.Reservation;
import com.coffee.service.ReservationService;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "*")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    // GET reservations by cafe
    @GetMapping("/cafe/{cafeId}")
    public List<Reservation> getReservationsByCafe(@PathVariable Long cafeId) {
        return reservationService.getReservationsByCafe(cafeId);
    }

    // UPDATE reservation status
    @PutMapping("/{id}/status")
    public Reservation updateReservationStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return reservationService.updateReservationStatus(id, status);
    }

}
