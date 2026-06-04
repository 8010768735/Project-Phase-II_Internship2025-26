package com.coffee.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.coffee.entity.FavoriteItem;
import com.coffee.repository.FavoriteRepository;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    public FavoriteService(FavoriteRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    public List<FavoriteItem> getUserFavorites(Long userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Map<String, Object> toggleFavorite(FavoriteItem favoriteItem) {
        Optional<FavoriteItem> existingFavorite =
            favoriteRepository.findByUserIdAndItemId(favoriteItem.getUserId(), favoriteItem.getItemId());

        Map<String, Object> response = new HashMap<>();

        if (existingFavorite.isPresent()) {
            favoriteRepository.delete(existingFavorite.get());
            response.put("favorited", false);
            response.put("message", "Item removed from favourites");
            return response;
        }

        FavoriteItem savedFavorite = favoriteRepository.save(favoriteItem);
        response.put("favorited", true);
        response.put("message", "Item added to favourites");
        response.put("favorite", savedFavorite);
        return response;
    }
}
