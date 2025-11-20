import React from "react";

interface Props {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: (id: string) => void;
}

const AddOnCheckbox: React.FC<Props> = ({ id, label, checked, disabled, onToggle }) => {
  return (
    <label className="addon" aria-disabled={disabled}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={() => onToggle(id)}
      />
      <span className="label">{label}</span>
    </label>
  );
};

export default AddOnCheckbox;
