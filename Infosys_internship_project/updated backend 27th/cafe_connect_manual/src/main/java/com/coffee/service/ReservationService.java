package com.coffee.service;



import org.springframework.stereotype.Service;

import com.coffee.entity.Reservation;
import com.coffee.repository.ReservationRepo;

import java.util.List;
import java.util.Optional;

@Service
public class ReservationService {

    private final ReservationRepo reservationRepo;

    public ReservationService(ReservationRepo reservationRepo) {
        this.reservationRepo = reservationRepo;
    }

    // Get reservations by cafe
    public List<Reservation> getReservationsByCafe(Long cafeId) {
        return reservationRepo.findByCafeId(cafeId);
    }

    // Update reservation status
    public Reservation updateReservationStatus(Long id, String status) {

        Optional<Reservation> optionalReservation = reservationRepo.findById(id);

        if(optionalReservation.isPresent()) {

            Reservation reservation = optionalReservation.get();
            reservation.setStatus(status);

            return reservationRepo.save(reservation);
        }

        return null;
    }

}
