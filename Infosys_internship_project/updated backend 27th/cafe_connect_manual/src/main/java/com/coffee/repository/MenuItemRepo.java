package com.coffee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coffee.entity.MenuItem;

public interface MenuItemRepo extends JpaRepository<MenuItem, Long> {
     
	List<MenuItem> findByCafeId(Long cafeId);

}
