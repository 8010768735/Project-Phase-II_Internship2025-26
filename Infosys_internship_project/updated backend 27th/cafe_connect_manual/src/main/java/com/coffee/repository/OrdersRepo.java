package com.coffee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coffee.entity.Orders;


public interface OrdersRepo extends JpaRepository<Orders, Long> {

	List<Orders> findByCafeId(Long cafeId);
	List<Orders> findByCustomerIdOrderByIdDesc(Long customerId);
}
