import React from "react";

type Props = {
  active?: string;
  completed?: string[];
};

const ALL_STEPS = [
  "Location",
  "About",
  "Features",
  "Rules",
  "Pricing",
  "Promotion",
  "Pictures",
  "Insurance",
  "Subscription",
  "Device",
  "Easy Access",
];

const CheckIcon = () => (
  <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M1 5.2L4.2 8.4L11 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LeftSteps: React.FC<Props> = ({ active = "Subscription", completed = [] }) => {
  const isDone = (name: string) => completed.includes(name);

  return (
    <aside className="left-steps" aria-label="Listing steps">
      <ul>
        {ALL_STEPS.map((step) => {
          const done = isDone(step);
          const activeClass = step === active ? "active" : "";
          const doneClass = done ? "done" : "";
          const upcomingClass = !done && !activeClass ? "upcoming" : "";

          return (
            <li
              key={step}
              className={`${activeClass} ${doneClass} ${upcomingClass}`.trim()}
              aria-current={step === active ? "step" : undefined}
            >
              <span className="step-text">{step}</span>

              {done ? (
                <span className="step-check" aria-hidden>
                  <span className="step-check-inner" aria-hidden>
                    <CheckIcon />
                  </span>
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default LeftSteps;
