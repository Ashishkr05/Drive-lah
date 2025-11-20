import React from "react";

interface Props {
  id: "just" | "good" | "best";
  title: string;
  price?: string;
  features: string[];
  selected?: boolean;
  onSelect: (id: "just" | "good" | "best") => void;
}

const PlanCard: React.FC<Props> = ({ id, title, price, features, selected, onSelect }) => {
  return (
    <button
      type="button"
      className={`plan-card ${selected ? "selected" : ""}`}
      aria-pressed={!!selected}
      aria-label={`Select ${title} plan`}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(id);
      }}
    >
      <div className="plan-card-inner">
        <div className="plan-title">{title}</div>

        <ul className="plan-features" aria-hidden={false}>
          {features.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>

        <div className="plan-footer">
          <div className="plan-price">{price}</div>
          <div className="chev" aria-hidden>
            ▶
          </div>
        </div>
      </div>
    </button>
  );
};

export default PlanCard;
