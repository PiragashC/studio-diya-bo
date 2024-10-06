import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import api from "./api";
import { setLogout } from "./state";
import Preloader from "./Preloader";

const ProtectedRoute = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsAuth(false);
        return;
      }

      try {
        const response = await api.get("/api/auth/check-token-validity", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAuth(response.data?.user);
      } catch (error) {
        dispatch(setLogout());
        setIsAuth(false);
      }
    };

    validateToken();
  }, [token, dispatch]);

  if (isAuth === null) {
    return <Preloader />;
  }

  const { pathname } = location;
  const childType = children.type?.componentName;
  const isAuthPage = ["AdminLogin"].includes(childType);

  if (isAuthPage && isAuth) {
    const redirectPath = isAuth.role === "Admin" ? "/orders" : "/";
    return <Navigate to={redirectPath} />;
  }

  if (!isAuth && !isAuthPage) {
    if (
      pathname.startsWith("/admin-dashboard") ||
      pathname.startsWith("/new-order") ||
      pathname.startsWith("/edit-order") ||
      pathname.startsWith("/orders") ||
      pathname.startsWith("/order-types") 
    ) {
      return <Navigate to="/admin-login" />;
    }
  }

  if (childType === "VendorList") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return children;
};

export default ProtectedRoute;
