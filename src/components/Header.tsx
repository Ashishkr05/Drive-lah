import React, { useState } from "react";
import logo from "../assets/drive-lah-logo.png";

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);

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

        <div className="right-actions">
          <nav className="nav-desktop" aria-label="top navigation">
            <a href="#" className="link">Learn more</a>
            <a href="#" className="link">List your car</a>
            <a href="#" className="link">Inbox</a>
            <img
              className="profile-pic"
              src="https://i.pravatar.cc/40?img=12"
              alt="profile"
            />
          </nav>
        </div>
      </header>

      {/* Mobile overlay + menu */}
      {open && (
        <div
          className="mobile-menu-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
          onClick={() => setOpen(false)}
        >
          {/* stop clicks from closing when clicking inside the menu panel */}
          <nav
            className="nav-mobile"
            onClick={(e) => {
              e.stopPropagation();
            }}
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
