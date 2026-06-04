package com.coffee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coffee.entity.CustomerFeedback;

public interface CustomerFeedbackRepository extends JpaRepository<CustomerFeedback, Long> {

    List<CustomerFeedback> findByCafeIdOrderByCreatedAtDesc(Long cafeId);

    List<CustomerFeedback> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
