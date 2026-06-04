package com.coffee.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coffee.entity.FavoriteItem;

public interface FavoriteRepository extends JpaRepository<FavoriteItem, Long> {

    List<FavoriteItem> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<FavoriteItem> findByUserIdAndItemId(Long userId, Long itemId);
}
