// src/components/AddOnCheckbox.tsx
import React from "react";

type Props = {
  id: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  onToggle: (id: string) => void;
};

const AddOnCheckbox: React.FC<Props> = ({ id, label, checked, disabled, comingSoon, onToggle }) => {
  return (
    <button
      type="button"
      className={`addon-box${disabled ? " disabled" : ""}`}
      onClick={() => {
        if (!disabled) onToggle(id);
      }}
      aria-pressed={!!checked}
      aria-disabled={!!disabled}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          onToggle(id);
        }
      }}
    >
      <div className="addon-left" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {comingSoon && <span className="addon-coming">Coming soon</span>}
        <div className="addon-label">{label}</div>
      </div>

      <div aria-hidden style={{ display: "flex", alignItems: "center" }}>
        <span className={`circle${checked ? " checked" : ""}`} />
      </div>
    </button>
  );
};

export default AddOnCheckbox;
