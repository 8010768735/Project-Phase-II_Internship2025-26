import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <Header />
      
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to CafeConnect</h1>
            <p className="hero-subtitle">Book Your Table, Order Your Food, Skip the Wait</p>
            <p className="hero-description">
              Experience seamless cafe dining with our all-in-one platform. 
              Reserve tables, pre-order your favorite meals, and pay online for a hassle-free experience.
            </p>
            <div className="hero-buttons">
              <Link to="/role-selection" className="btn btn-primary">Get Started</Link>
              <Link to="/role-selection" className="btn btn-secondary">Browse Cafes</Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="services" className="features-section">
          <h2 className="section-title">Why Choose CafeConnect?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Easy Table Booking</h3>
              <p>Reserve your table at your favorite café in just a few clicks. Choose your preferred date and time.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🍽️</div>
              <h3>Pre-Order Food</h3>
              <p>Browse the menu and order your food in advance. Your meal will be ready when you arrive.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Secure Payment</h3>
              <p>Pay online with confidence using our secure payment gateway. Multiple payment options available.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h3>Save Time</h3>
              <p>No more waiting in queues. Your table and food are ready when you arrive at the café.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Real-Time Updates</h3>
              <p>Get instant notifications about your order status from preparation to serving.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏪</div>
              <h3>Multiple Cafés</h3>
              <p>Choose from a wide range of cafés in your area. Find the perfect spot for every occasion.</p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="how-it-works-section">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Create your account and complete your profile</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Choose Cafe</h3>
              <p>Browse and select your favorite café</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Book & Order</h3>
              <p>Reserve a table and pre-order your food</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Pay Online</h3>
              <p>Complete secure payment</p>
            </div>
            <div className="step">
              <div className="step-number">5</div>
              <h3>Enjoy</h3>
              <p>Arrive and enjoy your meal!</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Transform Your Cafe Experience?</h2>
            <p>Join thousands of happy customers enjoying hassle-free cafe dining</p>
            <Link to="/role-selection" className="btn btn-cta">Sign Up Now</Link>
          </div>
        </section>

        {/* For Business Section */}
        <section className="business-section">
          <div className="business-content">
            <h2>Are You a Cafe Owner?</h2>
            <p>Streamline your operations, manage bookings, and grow your business with CafeConnect</p>
            <div className="business-features">
              <div className="business-feature">✓ Manage tables and bookings</div>
              <div className="business-feature">✓ Digital menu management</div>
              <div className="business-feature">✓ Staff coordination tools</div>
              <div className="business-feature">✓ Real-time order tracking</div>
              <div className="business-feature">✓ Secure payment processing</div>
              <div className="business-feature">✓ Customer analytics & insights</div>
            </div>
            <Link to="/signup/cafe-owner" className="btn btn-business">Register Your Cafe</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;

