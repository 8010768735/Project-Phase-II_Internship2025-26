import { Link, useNavigate, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import './Header.css';

const Header = ({ titleOnly = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId) => {
    // If not on homepage, navigate to homepage first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      // Already on homepage, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <header className="header">
      <div className={`header-container ${titleOnly ? 'header-container-title-only' : ''}`}>
        <div className="logo">
          <Link to="/">
            <h1>☕ CafeConnect</h1>
          </Link>
        </div>
        {!titleOnly && (
          <>
            <nav className="nav-menu">
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><a onClick={() => scrollToSection('services')}>Services</a></li>
                <li><a onClick={() => scrollToSection('how-it-works')}>How It Works</a></li>
                <li><a onClick={() => scrollToSection('contact')}>Contact</a></li>
              </ul>
            </nav>
            <div className="header-actions">
              {location.pathname === '/' && <LanguageSelector includeWidget={false} />}
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-login">Login</Link>
                <Link to="/role-selection" className="btn btn-signup">Sign Up</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
