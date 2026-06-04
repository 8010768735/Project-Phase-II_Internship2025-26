package com.coffee.io;

public class AdminDashboardSummaryResponse {

    private long totalUsers;
    private long approvedUsers;
    private long pendingUsers;
    private long rejectedUsers;
    private long totalCafes;
    private long totalCustomers;
    private long totalCafeOwners;

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getApprovedUsers() {
        return approvedUsers;
    }

    public void setApprovedUsers(long approvedUsers) {
        this.approvedUsers = approvedUsers;
    }

    public long getPendingUsers() {
        return pendingUsers;
    }

    public void setPendingUsers(long pendingUsers) {
        this.pendingUsers = pendingUsers;
    }

    public long getRejectedUsers() {
        return rejectedUsers;
    }

    public void setRejectedUsers(long rejectedUsers) {
        this.rejectedUsers = rejectedUsers;
    }

    public long getTotalCafes() {
        return totalCafes;
    }

    public void setTotalCafes(long totalCafes) {
        this.totalCafes = totalCafes;
    }

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getTotalCafeOwners() {
        return totalCafeOwners;
    }

    public void setTotalCafeOwners(long totalCafeOwners) {
        this.totalCafeOwners = totalCafeOwners;
    }
}
