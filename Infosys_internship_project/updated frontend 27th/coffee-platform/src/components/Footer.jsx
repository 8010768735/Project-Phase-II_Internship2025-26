import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="contact" className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>About CafeConnect</h3>
          <p>Your one-stop platform for booking tables, ordering food, and enjoying seamless cafe experiences.</p>
        </div>
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/" onClick={() => scrollToSection('services')}>Services</Link></li>
            <li><Link to="/role-selection">Browse Cafes</Link></li>
            <li><Link to="/" onClick={() => scrollToSection('contact')}>Contact</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>For Business</h3>
          <ul>
            <li><Link to="/signup/cafe-owner">Register Your Cafe</Link></li>
            <li><Link to="/login">Cafe Owner Login</Link></li>
            <li><Link to="/">Terms & Conditions</Link></li>
            <li><Link to="/">Privacy Policy</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Contact Us</h3>
          <p>📧 support@cafeconnect.com</p>
          <p>📞 +91 95023 79375</p>
          <div className="social-links">
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Instagram">📷</a>
            <a href="#" aria-label="Twitter">🐦</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 CafeConnect. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

