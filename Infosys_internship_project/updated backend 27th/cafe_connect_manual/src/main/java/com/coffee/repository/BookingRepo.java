package com.coffee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coffee.entity.Booking;

public interface BookingRepo extends JpaRepository<Booking, Long> {

    List<Booking> findByCafeId(Long cafeId);

    List<Booking> findByCustomerIdOrderByIdDesc(Long customerId);

    List<Booking> findByCafeIdAndTableIdAndBookingDateAndBookingTime(
            Long cafeId,
            Long tableId,
            String bookingDate,
            String bookingTime
    );
}
