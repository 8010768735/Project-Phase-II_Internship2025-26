package com.coffee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coffee.entity.Reservation;

public interface ReservationRepo extends JpaRepository<Reservation, Long> {

	List<Reservation> findByCafeId(Long cafeId);
}
