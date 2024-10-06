import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Link, useLocation, Outlet } from "react-router-dom";
import Preloader from "../../Preloader";

import { Ripple } from "primereact/ripple";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import "../Css/style.css";
import "../Css/responsive.css";
import { useDispatch, useSelector } from "react-redux";
import { setLogout } from "../../state";

const Layout = () => {
  const navigate = useNavigate;
  const { pathname, state } = useLocation();
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const dropdowMenuRef = useRef(null);
  const user = useSelector((state) => state.auth.user);

  const toggleDropdownMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event) => {
    if (
      dropdowMenuRef.current &&
      !dropdowMenuRef.current.contains(event.target)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setFullScreen(true))
        .catch((err) =>
          console.error(`Failed to enter fullscreen mode: ${err.message}`)
        );
    } else {
      document
        .exitFullscreen()
        .then(() => setFullScreen(false))
        .catch((err) =>
          console.error(`Failed to exit fullscreen mode: ${err.message}`)
        );
    }
  };
  const closeMenu = () => {
    setMenuOpen(false);
  };

  const goToLink = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogOut = () => {
    confirmDialog({
      message: "Are you sure you want to log out?",
      header: "Logout Confirmation",
      icon: "bi bi-info-circle",
      defaultFocus: "reject",
      acceptClassName: "p-button-danger",
      accept: () => {
        dispatch(setLogout());
      },
    });
    setMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <div
        className={`menu-backdrop ${menuOpen ? "show" : ""}`}
        onClick={closeMenu}
      ></div>

      <ConfirmDialog />
      <Preloader />

      {/* Side bar */}
      <aside className={`navigation_area ${menuOpen ? "active" : ""} `}>
        <div className="toggle_close  p-ripple" onClick={toggleMenu}>
          <i className="bi bi-x"></i>
          <Ripple />
        </div>
        <ul>
          <li>
            <Link href="#" className="logo_title_area">
              <span class="icon logo zoom-logo">
                <img
                  src="/assets/images/diya_logo-removebg-preview.png"
                  alt=""
                />
              </span>
              
              <span class="logo_title mx-2">
                {/* The <br /> */}
                <span>Studio Diya</span>
              </span>
            </Link>
          </li>
        
          <li className={`${pathname === "/new-order" ? "active" : ""}`}>
            <Link to={"/new-order"} onClick={() => setMenuOpen(false)}>
              <span className="icon">
                <i className="bi bi-calendar2-event"></i>
              </span>
              <span className="title">New Order</span>
            </Link>
          </li>

          {state?.order && (
            <li className={`${pathname === "/edit-order" ? "active" : ""}`}>
              <Link to={"/edit-order"} onClick={() => setMenuOpen(false)}>
                <span className="icon">
                  <i className="bi bi-calendar2-event"></i>
                </span>
                <span className="title">Edit Order</span>
              </Link>
            </li>
          )}

          <li className={`${pathname === "/orders" ? "active" : ""}`}>
            <Link to={"/orders"} onClick={() => setMenuOpen(false)}>
              <span className="icon">
                <i className="bi bi-calendar2-check"></i>
              </span>
              <span className="title">Orders</span>
            </Link>
          </li>

          <li className={`${pathname === '/order-types' ? 'active' : ''}`}>
                        <Link to={'/order-types'} onClick={() => setMenuOpen(false)}>
                            <span className="icon">
                                <i className="bi bi-layers"></i>
                            </span>
                            <span className="title">Order Types</span>
                        </Link>
                    </li>
          <li>
            <Link onClick={handleLogOut}>
              <span className="icon">
                <i className="bi bi-box-arrow-in-right"></i>
              </span>
              <span className="title">Sign Out</span>
            </Link>
          </li>
        </ul>
      </aside>

      <div className="main_area">
        {/* Nav bar */}
        <nav className={`topbar ${scrolled ? "scrolled" : ""}`}>
          <div className="d-flex">
            <div className="toggle_menu p-ripple" onClick={toggleMenu}>
              <i class={`bi bi-list`}></i>
              <Ripple />
            </div>
            <div
              className="fullscreen_toggle p-ripple"
              onClick={toggleFullScreen}
            >
              <i
                class={`bi ${
                  fullScreen ? "bi-fullscreen-exit" : "bi-fullscreen"
                }`}
              ></i>
              <Ripple />
            </div>
          </div>

          <div className="user_toggle_area" ref={dropdowMenuRef}>
            <div className="user_toggle p-ripple" onClick={toggleDropdownMenu}>
              <img src="/assets/images/user.png" alt="Profile" />
              <Ripple />
            </div>

            <ul
              className={`profile-dropdown-menu admin ${isOpen ? "open" : ""}`}
            >
              <div className="profile-dropdown-detail p-1">
                <div className="profile-dropdown-image-area">
                  <img
                    src={"assets/images/user.png"}
                    className="profile-dropdown-no-img"
                    alt=""
                  />
                </div>
                <h6 className="dropdown-profile-name">{user?.name}</h6>
              </div>
              <li className="profile-dropdown-item mb-1 mt-1">
                <button className="profile-dropdown-link profile p-ripple">
                  <i className="bi bi-person me-2"></i>
                  Profile
                  <Ripple />
                </button>
              </li>
              <li className="profile-dropdown-item">
                <button
                  className="profile-dropdown-link logout p-ripple"
                  type="button"
                  onClick={handleLogOut}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                  <Ripple />
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Page content */}
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default Layout;
