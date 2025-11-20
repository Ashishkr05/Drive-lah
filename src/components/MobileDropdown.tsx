// src/components/MobileDropdown.tsx
import React from "react";

interface Props {
  value?: string;
  onOpen?: () => void;
}

const MobileDropdown: React.FC<Props> = ({ value = "Subscription", onOpen }) => {
  return (
    <div className="mobile-dropdown" role="button" aria-haspopup="listbox" onClick={onOpen}>
      <div className="mobile-dropdown-inner">
        <span className="mobile-dropdown-value">{value}</span>
        <span className="mobile-caret">▾</span>
      </div>
    </div>
  );
};

export default MobileDropdown;
