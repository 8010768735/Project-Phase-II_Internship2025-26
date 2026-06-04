import React from 'react';
import { useParams } from 'react-router-dom';
import CustomerDashboard from '../dashboards/CustomerDashboard';
// import CustomerProfile from "./CustomerProfile"
import CafeOwnerDashboard from "../dashboards/ownerDashboardComponents/CafeOwnerDashboard";
import WaiterDashboard from '../dashboards/WaiterDashboard';
import ChefDashboard from '../dashboards/ChefDashboard';
import AdminDashboard from '../dashboards/AdminDashboard';
import EventStaffDashboard from '../dashboards/EventStaffDashboard';
// import Header from '../components/Header';
import Footer from '../components/Footer';
import './DashboardPage.css'; // Assuming you'll create this CSS file

const DashboardPage = () => {
  const { role } = useParams();
  const normalizedRole = String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const hideFooter = ['cafe_owner', 'waiter', 'chef', 'event_staff'].includes(normalizedRole);

  const renderDashboard = () => {
    switch (normalizedRole) {
      case 'customer':
        return <CustomerDashboard />;
      case 'cafe_owner':
        return <CafeOwnerDashboard />;
      case 'waiter':
        return <WaiterDashboard />;
      case 'chef':
        return <ChefDashboard />;
      case 'event_staff':
        return <EventStaffDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div>Please select a valid role to view the dashboard.</div>;
    }
  };

  return (
    <div className="dashboard-page">
      {/* <Header /> */}
      <main className="dashboard-content">
        {renderDashboard()}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default DashboardPage;
