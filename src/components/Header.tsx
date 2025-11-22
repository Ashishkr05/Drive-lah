// src/components/Header.tsx
import React, { useEffect, useState } from "react";
import logo from "../assets/drive-lah-logo.png";
import profileMobile from "../assets/profile-pic-mobile.png";
import profileDesktop from "../assets/profile-pic-desktop.jpeg";

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);

useEffect(() => {
  const headerHeight = 50;

  const isDesktop = () => {
    try {
      return typeof window !== "undefined" && window.innerWidth >= 920;
    } catch {
      return true;
    }
  };

  const applyHeaderPositionForDesktop = () => {
    try {
      if (isDesktop()) {
        // add a body marker class to indicate desktop header should be static
        document.body.classList.add("header-static-desktop");
      } else {
        document.body.classList.remove("header-static-desktop");
      }
    } catch {}
  };

  const onScroll = () => {
    try {
      // subscriptionMobile remains the trigger for transparency behavior
      const subscriptionMobile = document.body.classList.contains("subscription-mobile");

      // If we're on desktop, we do NOT want any transparency behavior:
      // remove content-over and return.
      if (isDesktop()) {
        document.body.classList.remove("content-over");
        return;
      }

      // For non-desktop (mobile), only toggle content-over when subscription-mobile is active
      if (!subscriptionMobile) {
        document.body.classList.remove("content-over");
        return;
      }

      const y = window.scrollY || window.pageYOffset || 0;
      if (y > headerHeight) {
        document.body.classList.add("content-over");
      } else {
        document.body.classList.remove("content-over");
      }
    } catch {}
  };

  // run initial layout updates
  applyHeaderPositionForDesktop();
  onScroll();

  const onResize = () => {
    // update desktop/static marker and run the same scroll logic to keep classes in sync
    applyHeaderPositionForDesktop();
    onScroll();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    try {
      document.body.classList.remove("content-over");
      document.body.classList.remove("header-static-desktop");
    } catch {}
  };
}, []);

  useEffect(() => {
    try {
      if (open) document.body.classList.add("mobile-menu-open");
      else document.body.classList.remove("mobile-menu-open");
    } catch {}
  }, [open]);

  return (
    <>
      <header className="dl-header" role="banner">
        <button
          className="hamburger"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="h-line" />
          <span className="h-line" />
          <span className="h-line" />
        </button>

        <div className="brand" aria-hidden={false}>
          <img src={logo} alt="Drive lah" className="brand-logo" />
          <span className="brand-title">Drive lah</span>
        </div>

        <img className="mobile-profile" src={profileMobile} alt="profile" aria-hidden={false} />

        <div className="right-actions">
          <nav className="nav-desktop" aria-label="top navigation">
            <a href="#" className="link">Learn more</a>
            <a href="#" className="link">List your car</a>
            <a href="#" className="link">Inbox</a>
            <img className="profile-pic" src={profileDesktop} alt="profile" />
          </nav>
        </div>
      </header>

      {open && (
        <div
          className="mobile-menu-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
          onClick={() => setOpen(false)}
        >
          <nav
            className="nav-mobile"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="mobile-close"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>

            <div className="menu-panel">
              <a className="m-link" href="#" onClick={() => setOpen(false)}>Learn more</a>
              <a className="m-link" href="#" onClick={() => setOpen(false)}>List your car</a>
              <a className="m-link" href="#" onClick={() => setOpen(false)}>Inbox</a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;
