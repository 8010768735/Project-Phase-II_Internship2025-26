package com.coffee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coffee.entity.CafeDetails;

public interface CafeDetailsRepo extends JpaRepository<CafeDetails, Long> {

	List<CafeDetails> findByOwnerId(Long ownerId);
	
}