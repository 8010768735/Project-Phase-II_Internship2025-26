package com.coffee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coffee.entity.CafeTable;

public interface CafeTableRepository extends JpaRepository<CafeTable, Long> {

	List<CafeTable> findByCafeId(Long cafeId);
}
