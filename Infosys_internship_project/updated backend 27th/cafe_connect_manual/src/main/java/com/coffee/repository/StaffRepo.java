package com.coffee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coffee.entity.Staff;

public interface StaffRepo extends JpaRepository<Staff, Long> {

	List<Staff> findByCafeId(Long cafeId);
	
	Staff findByEmailIgnoreCase(String email);
}
