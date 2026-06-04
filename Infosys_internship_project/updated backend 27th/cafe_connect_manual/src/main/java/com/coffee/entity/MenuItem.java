package com.coffee.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;

@Entity 
@Table(name = "menu_item")
public class MenuItem {
	@Id 
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long id;
	private String itemName;
    private double price;
    private String description;
    private String imageUrl;
    private String seasonalOfferSeason;
    private Double seasonalOfferPercentage;
//    private Long cafeId;
    
    @ManyToOne
    @JoinColumn(name = "cafe_id")
    @JsonBackReference
    private CafeDetails cafe;


//    =======================getters and setters===================
    
    
    
	public Long getId() {
		return id;
	}
	public CafeDetails getCafe() {
		return cafe;
	}
	public void setCafe(CafeDetails cafe) {
		this.cafe = cafe;
	}
	public void setId(Long id) {
		this.id = id;
	}
	
	
	public String getItemName() {
		return itemName;
	}
//	public Long getCafeId() {
//		return cafeId;
//	}
//	public void setCafeId(Long cafeId) {
//		this.cafeId = cafeId;
//	}
	public void setItemName(String itemName) {
		this.itemName = itemName;
	}
	public double getPrice() {
		return price;
	}
	public void setPrice(double price) {
		this.price = price;
	}
	public String getDescription() {
		return description;
	}
	public void setDescription(String description) {
		this.description = description;
	}
	public String getImageUrl() {
		return imageUrl;
	}
	public void setImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}
	public String getSeasonalOfferSeason() {
		return seasonalOfferSeason;
	}
	public void setSeasonalOfferSeason(String seasonalOfferSeason) {
		this.seasonalOfferSeason = seasonalOfferSeason;
	}
	public Double getSeasonalOfferPercentage() {
		return seasonalOfferPercentage;
	}
	public void setSeasonalOfferPercentage(Double seasonalOfferPercentage) {
		this.seasonalOfferPercentage = seasonalOfferPercentage;
	}
    
    
    
    
    
    
}
