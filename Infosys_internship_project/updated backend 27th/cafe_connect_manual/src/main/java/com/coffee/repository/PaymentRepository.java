package com.coffee.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coffee.entity.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
}
