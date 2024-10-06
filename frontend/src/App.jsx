import React, { Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import Preloader from "./Preloader";

import AOS from "aos";
import { PrimeReactProvider } from "primereact/api";

import "primereact/resources/themes/bootstrap4-light-purple/theme.css";
import ProtectedRoute from "./ProtectedRoute";

/* For admin panel */
import AdminLogin from "./admin/AdminLogin/AdminLogin";
import Layout from "./admin/AdminLayout/Layout";

/* For admin panel */
const AdminDashboard = React.lazy(() =>
  import("./admin/AdminDashboard/AdminDashboard")
);
const Order = React.lazy(() => import("./admin/Order/Order"));
const Bookings = React.lazy(() => import("./admin/Bookings/Bookings"));
const Customers = React.lazy(() => import("./admin/Customers/Customers"));

function App() {
  const value = {
    ripple: true,
  };

  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
      mirror: false,
    });
  }, []);

  return (
    <PrimeReactProvider value={value}>
      <Routes>
        {/* Admin routes */}
        <Route
          path="/admin-login"
          element={
            <ProtectedRoute>
              <AdminLogin />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Layout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<Preloader />}>
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              </Suspense>
            }
          />
          <Route
            path="new-order"
            element={
              <Suspense fallback={<Preloader />}>
                <ProtectedRoute>
                  <Order />
                </ProtectedRoute>
              </Suspense>
            }
          />
          <Route
            path="edit-order"
            element={
              <Suspense fallback={<Preloader />}>
                <ProtectedRoute>
                  <Order />
                </ProtectedRoute>
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<Preloader />}>
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              </Suspense>
            }
          />
          <Route
            path="order-types"
            element={
              <Suspense fallback={<Preloader />}>
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              </Suspense>
            }
          />
        </Route>
        {/*  */}
      </Routes>
    </PrimeReactProvider>
  );
}

export default App;
