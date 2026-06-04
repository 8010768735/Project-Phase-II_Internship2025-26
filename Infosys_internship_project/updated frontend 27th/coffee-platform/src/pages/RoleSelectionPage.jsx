import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './RoleSelectionPage.css';

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      icon: '\u{1F464}',
      description: 'Book tables, order food, and enjoy seamless cafe experiences',
      features: ['Table Booking', 'Pre-Order Food', 'Secure Payment', 'Order Tracking']
    },
    {
      id: 'cafe_owner',
      title: 'Cafe Owner',
      icon: '\u{1F3EA}',
      description: 'Manage your cafe, menu, staff, and grow your business',
      features: ['Manage Menu', 'Staff Management', 'Booking Management', 'Analytics']
    }
  ];

  const handleRoleSelect = (roleId) => {
    navigate(`/signup/${roleId}`);
  };

  return (
    <div className="role-selection-page">
      <Header />

      <main className="role-selection-content">
        <div className="role-selection-container">
          <div className="role-selection-header">
            <h1>Choose Your Role</h1>
            <p>Select the role that best describes you to get started with CafeConnect</p>
          </div>

          <div className="roles-grid">
            {roles.map((role) => (
              <div
                key={role.id}
                className="role-card"
                onClick={() => handleRoleSelect(role.id)}
              >
                <div className="role-icon">{role.icon}</div>
                <h2>{role.title}</h2>
                <p className="role-description">{role.description}</p>
                <ul className="role-features">
                  {role.features.map((feature, index) => (
                    <li key={index}>{'\u2713'} {feature}</li>
                  ))}
                </ul>
                <button className="btn-select-role">
                  Select {role.title}
                </button>
              </div>
            ))}
          </div>

          <div className="role-selection-footer">
            <p>Already have an account? <a href="/login">Login here</a></p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RoleSelectionPage;
