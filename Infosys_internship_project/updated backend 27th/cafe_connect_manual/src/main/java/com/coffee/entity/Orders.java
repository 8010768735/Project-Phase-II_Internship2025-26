package com.coffee.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "orders")
public class Orders {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customer;
    
    private Long customerId;
    
    private String cafeName;

    private String status;
    
    @Column(name = "order_status")
    private String orderStatus;

    private Long cafeId;
    
    @Column(name = "no_of_items", nullable = false)
    private Integer noOfItems;

    @Column(nullable = false)
    private Double price;

    @Column(name = "table_number", nullable = false)
    private Integer tableNumber;
    
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String itemsSummary;

    private Integer itemCount;

    private Double totalAmount;

    @Column(columnDefinition = "json")
    private String items;
    
    private Long assignedChefId;

    private String assignedChefName;

    private Long assignedWaiterId;

    private String assignedWaiterName;

    private LocalDateTime createdAt;

    public Orders() {}

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCustomer() {
        return customer;
    }

    public void setCustomer(String customer) {
        this.customer = customer;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCafeName() {
        return cafeName;
    }

    public void setCafeName(String cafeName) {
        this.cafeName = cafeName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public Long getCafeId() {
        return cafeId;
    }

    public void setCafeId(Long cafeId) {
        this.cafeId = cafeId;
    }

    public Integer getNoOfItems() {
        return noOfItems;
    }

    public void setNoOfItems(Integer noOfItems) {
        this.noOfItems = noOfItems;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Integer getTableNumber() {
        return tableNumber;
    }

    public void setTableNumber(Integer tableNumber) {
        this.tableNumber = tableNumber;
    }

    public String getItemsSummary() {
        return itemsSummary;
    }

    public void setItemsSummary(String itemsSummary) {
        this.itemsSummary = itemsSummary;
    }

    public Integer getItemCount() {
        return itemCount;
    }

    public void setItemCount(Integer itemCount) {
        this.itemCount = itemCount;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getItems() {
        return items;
    }

    public void setItems(String items) {
        this.items = items;
    }

    public Long getAssignedChefId() {
        return assignedChefId;
    }

    public void setAssignedChefId(Long assignedChefId) {
        this.assignedChefId = assignedChefId;
    }

    public String getAssignedChefName() {
        return assignedChefName;
    }

    public void setAssignedChefName(String assignedChefName) {
        this.assignedChefName = assignedChefName;
    }

    public Long getAssignedWaiterId() {
        return assignedWaiterId;
    }

    public void setAssignedWaiterId(Long assignedWaiterId) {
        this.assignedWaiterId = assignedWaiterId;
    }

    public String getAssignedWaiterName() {
        return assignedWaiterName;
    }

    public void setAssignedWaiterName(String assignedWaiterName) {
        this.assignedWaiterName = assignedWaiterName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}



//
//import jakarta.persistence.*;
//
//@Entity 
//public class Orders{
//
//	@Id
//	@GeneratedValue(strategy=GenerationType.IDENTITY)
//	private Long id;
//	private String customer;
//	private int tableNumber;
//	private int noOfItems;
//	private double price;
//	private String orderStatus;
//	private List<String> items;
//	
////	============= getters and setters =====================
//
//	
//	public Long getId() {
//		return id;
//	}
//	public void setId(Long id) {
//		this.id = id;
//	}
//	public String getCustomer() {
//		return customer;
//	}
//	public void setCustomer(String customer) {
//		this.customer = customer;
//	}
//	public int getTableNumber() {
//		return tableNumber;
//	}
//	public void setTableNumber(int tableNumber) {
//		this.tableNumber = tableNumber;
//	}
//	public int getNoOfItems() {
//		return noOfItems;
//	}
//	public void setNoOfItems(int noOfItems) {
//		this.noOfItems = noOfItems;
//	}
//	public double getPrice() {
//		return price;
//	}
//	public void setPrice(double price) {
//		this.price = price;
//	}
//	public String getStatus() {
//		return orderStatus;
//	}
//	public void setStatus(String orderStatus) {
//		this.orderStatus = orderStatus;
//	}
//	public List<String> getItems() {
//		return items;
//	}
//	public void setItems(List<String> items) {
//		this.items = items;
//	}
//	
//
//	
//	
//	
//	
//}
