# Coffee Ordering and Management Platform - Frontend

## Overview
This is the frontend application for the Web-Based Coffee Ordering and Management Platform. It's built with React and Vite, providing a modern, responsive user interface for customers, café owners, chefs, and waiters.

## Features Implemented

### 1. Homepage
- **Header**: Navigation menu with links to Home, About, Cafés, and Contact
- **Hero Section**: Eye-catching welcome section with call-to-action buttons
- **Features Section**: Showcases 6 key features of the platform
- **How It Works**: Step-by-step guide for users
- **CTA Section**: Encourages user registration
- **Business Section**: Information for café owners
- **Footer**: Links, contact information, and social media

### 2. Signup Page
- **Role Selection**: Dropdown to choose between Customer and Café Owner
- **Dynamic Form**: Shows additional fields for café owners (café name and address)
- **Form Fields**:
  - First Name & Last Name
  - Email Address (with verification notice)
  - Phone Number
  - Password & Confirm Password
  - Café-specific fields (conditional)
- **Info Box**: Explains the next steps after registration
- **Validation Ready**: Form structure ready for validation logic

### 3. Login Page
- **Clean Design**: Professional login interface
- **Form Fields**:
  - Email or Username
  - Password
  - Remember Me checkbox
- **Forgot Password**: Link to password recovery
- **Social Login**: Google sign-in option (ready for integration)
- **Info Cards**: Security and feature highlights
- **Responsive Layout**: Two-column layout on desktop, single column on mobile

## Technology Stack
- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **React Router DOM**: Client-side routing
- **CSS3**: Custom styling with gradients and animations

## Color Scheme
- Primary Brown: `#6B4423`
- Dark Brown: `#3E2723`
- Accent Gold: `#FFD700`
- Background: `#f5f5f5`

## Project Structure
```
coffee-platform/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Header.css
│   │   ├── Footer.jsx
│   │   └── Footer.css
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── HomePage.css
│   │   ├── SignupPage.jsx
│   │   ├── SignupPage.css
│   │   ├── LoginPage.jsx
│   │   └── LoginPage.css
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── public/
├── package.json
└── vite.config.js
```

## Running the Application

### Full Stack (Register & Login End-to-End)

1. **Start the Backend** (Spring Boot - requires Java 17+ and Maven):
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   API runs at `http://localhost:8080/api`

2. **Start the Frontend**:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:5173/`

3. **Test the flow**: Role Selection → Sign Up (MultiStepSignupPage) → Login (NewLoginPage)

### Development Server (Frontend Only)
```bash
npm run dev
```
The application will be available at `http://localhost:5173/`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Backend (Spring Boot)

- **Location**: `backend/`
- **APIs**: `POST /api/auth/register`, `POST /api/auth/login`
- **Auth**: JWT tokens stored in localStorage
- See `backend/README.md` for details

## Next Steps for Development

1. **Backend Integration** ✅ (Done)
   - ~~Connect signup form to Spring Boot API~~
   - ~~Implement authentication with JWT~~
   - Add email verification flow

2. **Profile Completion**
   - Create profile completion pages
   - Add DOB, Gender, Academic Info fields
   - Implement address form

3. **Café Features**
   - Café listing page
   - Café detail page with menu
   - Table booking interface
   - Food ordering system

4. **Payment Integration**
   - Integrate Razorpay/Stripe
   - Payment confirmation page

5. **Role-Based Dashboards**
   - Customer dashboard
   - Café owner dashboard
   - Chef interface
   - Waiter interface

6. **Real-time Features**
   - WebSocket integration for order updates
   - Live order status tracking

## Design Features
- ✅ Fully responsive design
- ✅ Modern gradient backgrounds
- ✅ Smooth animations and transitions
- ✅ Accessible form elements
- ✅ Professional color scheme
- ✅ Mobile-first approach

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes
- All forms are ready for validation logic
- API endpoints need to be configured
- Environment variables should be set up for production
- Email verification flow needs backend support

