import React from "react";
import "./Sidebar.css";
import { useNavigate } from "react-router-dom";
import {
  FaBookOpen,
  FaCalendarAlt,
  FaChair,
  FaChartPie,
  FaComments,
  FaCoffee,
  FaCreditCard,
  FaGlassCheers,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaStore,
  FaUsers,
  FaUserTie,
} from "react-icons/fa";
import { clearActiveSession } from "../../utils/session";

const Sidebar = ({ activeTab, setActiveTab, user }) => {
  const navigate = useNavigate();

  const menuItem = (tab, label, icon) => (
    <button
      className={`sidebar-item ${activeTab === tab ? "active" : ""}`}
      onClick={() => setActiveTab(tab)}
    >
      <span className="sidebar-item-icon" aria-hidden="true">{icon}</span>
      {label}
    </button>
  );

  const handleLogout = () => {
    clearActiveSession();
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">Owner Panel</span>
      </div>

      <div className="sidebar-user">
        <p>Welcome back!</p>
        <h4>{user?.firstName || "Owner"}</h4>
      </div>

      <div className="sidebar-nav">
        {menuItem("dashboard", "Dashboard", <FaChartPie />)}
        {menuItem("total_income", "Total Income", <FaMoneyBillWave />)}
        {menuItem("mycafes", "My Cafes", <FaStore />)}
        {menuItem("staff", "Staff", <FaUserTie />)}
        {menuItem("menu", "Menu", <FaBookOpen />)}
        {menuItem("orders", "Orders", <FaCoffee />)}
        {menuItem("reservations", "Reservations", <FaCalendarAlt />)}
        {menuItem("booking", "Tables", <FaChair />)}
        {menuItem("events", "Add Event", <FaGlassCheers />)}
        {menuItem("event_requests", "Event Request", <FaCalendarAlt />)}
        {menuItem("payments", "Payments", <FaCreditCard />)}
        {menuItem("feedback", "Feedback", <FaComments />)}
        {menuItem("customer_profile", "Customers", <FaUsers />)}
        <button onClick={handleLogout} className="sidebar-item sidebar-item-logout">
          <span className="sidebar-item-icon" aria-hidden="true"><FaSignOutAlt /></span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
