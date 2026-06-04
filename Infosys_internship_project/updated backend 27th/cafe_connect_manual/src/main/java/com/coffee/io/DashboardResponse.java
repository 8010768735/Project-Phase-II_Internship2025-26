package com.coffee.io;

import java.util.Map;

public class DashboardResponse {

    
	private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long notResetPassword;
    private long todayRegistrations;

    private Map<String, Long> roleDistribution;
    private Map<String, Long> weeklyGrowth;

    // constructor + getters
    
    public DashboardResponse(long totalUsers, long activeUsers, long inactiveUsers, long notResetPassword,
			long todayRegistrations, Map<String, Long> roleDistribution, Map<String, Long> weeklyGrowth) {
		super();
		this.totalUsers = totalUsers;
		this.activeUsers = activeUsers;
		this.inactiveUsers = inactiveUsers;
		this.notResetPassword = notResetPassword;
		this.todayRegistrations = todayRegistrations;
		this.roleDistribution = roleDistribution;
		this.weeklyGrowth = weeklyGrowth;
	}
    
    public long getTotalUsers() {
		return totalUsers;
	}
	public void setTotalUsers(long totalUsers) {
		this.totalUsers = totalUsers;
	}
	public long getActiveUsers() {
		return activeUsers;
	}
	public void setActiveUsers(long activeUsers) {
		this.activeUsers = activeUsers;
	}
	public long getInactiveUsers() {
		return inactiveUsers;
	}
	public void setInactiveUsers(long inactiveUsers) {
		this.inactiveUsers = inactiveUsers;
	}
	public long getNotResetPassword() {
		return notResetPassword;
	}
	public void setNotResetPassword(long notResetPassword) {
		this.notResetPassword = notResetPassword;
	}
	public long getTodayRegistrations() {
		return todayRegistrations;
	}
	public void setTodayRegistrations(long todayRegistrations) {
		this.todayRegistrations = todayRegistrations;
	}
	public Map<String, Long> getRoleDistribution() {
		return roleDistribution;
	}
	public void setRoleDistribution(Map<String, Long> roleDistribution) {
		this.roleDistribution = roleDistribution;
	}
	public Map<String, Long> getWeeklyGrowth() {
		return weeklyGrowth;
	}
	public void setWeeklyGrowth(Map<String, Long> weeklyGrowth) {
		this.weeklyGrowth = weeklyGrowth;
	}
	
}