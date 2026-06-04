import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import MultiStepSignupPage from './pages/MultiStepSignupPage';
import NewLoginPage from './pages/NewLoginPage';
import ScrollToTop from './components/ScrollToTop';
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import CustomerAccount from './pages/CustomerAccount';
import TableBookingPage from './pages/TableBookingPage';
import DashboardPage from './pages/DashboardPage'; 
// import CafeDetail from "./dashboards/ownerDashboardComponents/CafeDetail";
import CafeMenu from "./pages/CafeMenu";
import CartPage from "./pages/CartPage";
import CustomerProfileEdit from "./pages/CustomerProfileEdit"
import AppErrorBoundary from './components/AppErrorBoundary';
import LanguageSelector from './components/LanguageSelector';
import AiChatAssistant from './components/AiChatAssistant';

const CustomerChatAssistant = () => {
  const { pathname } = useLocation();
  const customerPaths = [
    '/dashboard/customer',
    '/customer-account',
    '/booking/',
    '/cafe/',
    '/cart',
  ];
  const isCustomerPage = customerPaths.some((path) =>
    path.endsWith('/') ? pathname.startsWith(path) : pathname === path || pathname.startsWith(`${path}/`)
  );

  return isCustomerPage ? <AiChatAssistant /> : null;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <LanguageSelector showControl={false} includeWidget />
      <AppErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/role-selection" element={<RoleSelectionPage />} />
          <Route path="/signup/:role" element={<MultiStepSignupPage />} />
          <Route path="/login" element={<NewLoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard/:role" element={<DashboardPage />} />
          <Route path="/customer-account" element={<CustomerAccount />} />
          <Route path="/booking/:cafeId" element={<TableBookingPage />} />
          <Route path="/cafe/:cafeId" element={<CafeMenu />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/customer-account/edit" element={<CustomerProfileEdit />} />
        </Routes>
      </AppErrorBoundary>
      <CustomerChatAssistant />
    </Router>
  );
}

export default App;
