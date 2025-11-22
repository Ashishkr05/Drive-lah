import React from "react";

type PlanId = "just" | "good" | "best";

interface Props {
  id: PlanId;
  title: string;
  features: string[];
  priceLabel: React.ReactNode;
  selected?: boolean;
  onSelect: (id: PlanId) => void;
}

const Icon: React.FC<{ type?: "pin" | "mileage" | "lock" }> = ({ type = "pin" }) => {
  if (type === "pin") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden focusable="false">
        <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.5 7-10a7 7 0 10-14 0c0 5.5 7 10 7 10z" />
        <circle cx="12" cy="10.5" r="1.5" fill="currentColor" />
      </svg>
    );
  } else if (type === "mileage") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden focusable="false">
        <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l2-4 4 8 4-6 2 4h2" />
        <circle cx="5.5" cy="17.5" r="1.5" fill="currentColor" />
        <circle cx="18.5" cy="17.5" r="1.5" fill="currentColor" />
      </svg>
    );
  } else {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden focusable="false">
        <rect x="4" y="10" width="16" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 10V8a5 5 0 0110 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
};

const PlanCard: React.FC<Props> = ({ id, title, features, priceLabel, selected, onSelect }) => {
  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(id);
        }
      }}
      className={`plan-card ${selected ? "selected" : ""}`}
      aria-pressed={!!selected}
      aria-label={`${title} plan${selected ? " selected" : ""}`}
    >
      <div className="plan-inner">
        <div className="plan-title">{title}</div>

        <ul className="plan-features" aria-hidden={false}>
          {features.map((f, i) => {
            const type = i === 0 ? "pin" : i === 1 ? "mileage" : "lock";
            return (
              <li key={i} className="plan-feature-item">
                <span className="feature-icon" aria-hidden>
                  <Icon type={type as any} />
                </span>
                <span className="feature-text">{f}</span>
              </li>
            );
          })}
        </ul>

        <div className="plan-footer">
          <div className="plan-price" aria-hidden>{priceLabel}</div>
        </div>
      </div>
    </div>
  );
};

export default PlanCard;
