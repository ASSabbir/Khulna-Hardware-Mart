import { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import Nav, { AuthProvider, useAuth } from './Components/Nav';
import Footer from './Components/Footer';
import AdminSetup from './Components/AdminSetup';

function RootContent() {
  const [needsSetup, setNeedsSetup] = useState(null);
  const location = useLocation();
  const { admin, loading } = useAuth();
  const isLoginPage = location.pathname === "/login";

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/check");
        setNeedsSetup(res.data.needsSetup);
      } catch (err) {
        console.error("Setup check failed:", err);
        setNeedsSetup(false);
      }
    };
    checkSetup();
  }, []);

  if (needsSetup === null || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show admin setup if no admin exists
  if (needsSetup) {
    return <AdminSetup onComplete={() => window.location.reload()} />;
  }

  // Public routes that don't require login
  const publicRoutes = ["/", "/login", "/products-catalog"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // If not logged in and trying to access protected route, redirect to login
  if (!admin && !isLoginPage && !isPublicRoute) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // For login page, don't show Nav/Footer
  if (isLoginPage) {
    return <Outlet />;
  }

  // If not logged in, show public pages with Nav/Footer
  if (!admin) {
    // Show Nav/Footer for public routes
    if (location.pathname === "/products-catalog") {
      return (
        <>
          <Nav />
          <Outlet />
          <Footer />
        </>
      );
    }
    return (
      <>
        <Nav />
        <Outlet />
        <Footer />
      </>
    );
  }

  // Logged in - show full app
  return (
    <>
      <Nav />
      <Outlet />
      <Footer />
    </>
  );
}

const Root = () => {
    return (
        <AuthProvider>
            <RootContent />
        </AuthProvider>
    );
};

export default Root;