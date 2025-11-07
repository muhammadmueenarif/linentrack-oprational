"use client"
export const dynamic = 'force-dynamic'
import { Poppins } from "next/font/google";
import "./globals.css";

// Configure Poppins font with multiple weights
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});
import { store } from "./Admin/store";
import { Provider } from "react-redux";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import DotLoader from "./Common/Components/DotLoader";
import { hasOperationsAccess } from "./enum/AccessMode";

// Import react-toastify components and CSS
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Public routes that don't require authentication
const publicRoutes = ['/Login'];

function AuthCheck({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('userData');

      // If logged in and trying to access Login page, redirect to Operations main page
      if (token && userData && pathname === '/Login') {
        try {
            const parsedData = JSON.parse(userData);
            if (parsedData.roleType === 'Staff' &&
                hasOperationsAccess(parsedData.accessMode)) {
              router.push('/');
            } else {
              router.push('/Login'); // Stay on login if not Operations staff
            }
        } catch (e) {
            console.error("Error parsing userData on redirect:", e);
            router.push('/Login');
        }
        return;
      }

      // Allow access to SuperAdmin routes without token check here
      if (pathname.startsWith('/SuperAdmin')) {
        setIsLoading(false);
        return;
      }

      // Allow access to other public routes
      if (publicRoutes.includes(pathname)) {
        setIsLoading(false);
        return;
      }

      // If not a public route and no token/userData, redirect to Login
      if (!token || !userData) {
        router.push('/Login');
        return;
      }

      // Check if user has Operations access
      try {
        const parsedData = JSON.parse(userData);
        if (parsedData.roleType === 'Staff' &&
            hasOperationsAccess(parsedData.accessMode)) {
          setIsLoading(false);
        } else {
          router.push('/Login'); // Redirect non-Operations users
        }
      } catch (e) {
        router.push('/Login');
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Show loader while checking authentication or redirecting
  if (isLoading) {
    return <DotLoader />;
  }

  // Render children if authentication check is complete and user is allowed
  return children;
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Redux Provider wraps the application */}
      <Provider store={store}>
        <body className={`${poppins.variable} font-poppins`}>
          {/* AuthCheck handles authentication logic and conditionally renders children */}
          <AuthCheck>{children}</AuthCheck>
          {/* ToastContainer is rendered here to be available globally */}
          <ToastContainer
             position="top-right"
             autoClose={3000}
             hideProgressBar={false}
             newestOnTop={false}
             closeOnClick
             rtl={false}
             pauseOnFocusLoss
             draggable
             pauseOnHover
             theme="light"
           />
        </body>
      </Provider>
    </html>
  );
}
