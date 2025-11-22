
# 🚗 Drive Lah – Frontend Developer Assignment

This project is a fully responsive, multi-step listing flow built exactly according to the **provided XD designs** (desktop + mobile).
It includes subscription selection, add-ons, masked payment details, and device management — all persisted in the browser’s localStorage.

---

## ⚙️ Setup Instructions

**1. Clone repository**

```bash
git clone https://github.com/Ashishkr05/Drive-lah
cd Drive-lah
```

**2. Install dependencies**

```bash
npm install
```

**3. Run development server**

```bash
npm run dev
```

Local dev URL:

```
http://localhost:5173
```

**4. Build for production**

```bash
npm run build
```

---

## 🧠 Assumptions & Design Decisions

* **XD designs are the single source of truth.**
  All spacing, layout, typography, and responsiveness match the provided desktop and mobile designs.

* **LocalStorage is used for all data.**
  The assignment requires no backend, so subscription, add-ons, masked card preview, and device entries persist entirely in the browser.

* **Masked card design for PCI-style safety.**
  Only masked PAN + last4 + expiry month/year are stored. CVV is never saved.

* **Plan-based add-ons are dynamically generated.**
  Add-ons shown depend on the selected plan. This avoids hard-coding logic inside UI components.

* **Device slots remain fixed.**
  Four device entries are always displayed in order, even across reloads.

* **Responsive layout follows design breakpoints.**
  Desktop layout uses static header + sidebar steps.
  Mobile layout uses fixed top header, dropdown navigation, and bottom CTA.

* **Animations kept subtle.**
  Expand/collapse transitions and hover effects match the assignment requirement for smooth interactions.

* **Accessibility included.**
  Keyboard toggles, aria roles, aria-live regions, and semantically correct HTML are used across all components.

---

## 📦 Third-Party Libraries & Rationale

### **React**

Used as the primary framework because the assignment requests a modern JavaScript framework and React provides fast component-driven UI development.

### **Redux Toolkit**

Chosen for predictable state management across multiple steps (subscription → add-ons → payment → device).
Helps maintain clean reducers and enables smooth state persistence.

### **React Router**

Used to handle navigation between multi-step screens while keeping the codebase modular.

### **Vite**

Selected as the build tool for:

* extremely fast development server
* instant HMR
* optimized production builds
* simple Netlify deployment behavior

### **SASS (SCSS)**

Required by assignment. Used for:

* maintaining clean, nested component styles
* variable management
* ensuring pixel-perfect adherence to XD designs

### **TypeScript**

Used to strictly type plan IDs, device states, add-ons, masked card data, and improve reliability of all logic-heavy areas.

---

## 📦 Environment & Versions

This project was developed and tested with:

- **Node:** v24.11.1 (Netlify build used v22.21.1 — Node 18+ works)
- **npm:** v11.6.2

Key dependency versions (from `package.json`):

- react: ^18.2.0  
- react-dom: ^18.2.0  
- @reduxjs/toolkit: ^1.9.5  
- react-redux: ^8.1.2  
- react-router-dom: ^7.9.6  
- vite: ^7.2.2  
- typescript: ~5.9.3  
- sass: ^1.94.2  

These versions ensure the project builds correctly on both local and Netlify environments.

---