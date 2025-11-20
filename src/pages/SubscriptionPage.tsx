import React, { useEffect, useState } from "react";
import PlanCard from "../components/PlanCard";
import AddOnCheckbox from "../components/AddOnCheckbox";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import { selectPlan, toggleAddOn } from "../store/subscriptionSlice";

const SubscriptionPage: React.FC = () => {
  const sub = useSelector((s: RootState) => s.subscription);
  const dispatch = useDispatch();

  // local micro saved indicator
  const [savedTick, setSavedTick] = useState(false);

  // show saved tick when redux state changes (persisted by slice)
  useEffect(() => {
    // skip initial render if nothing selected
    if (sub) {
      setSavedTick(true);
      const t = setTimeout(() => setSavedTick(false), 1100);
      return () => clearTimeout(t);
    }
  }, [sub.plan, sub.addOns?.map((a) => a.enabled).join(",")]);

  return (
    <section className="subscription-wrap">
      <aside className="left-steps" aria-hidden={false}>
        <nav>
          <ol>
            <li>Location</li>
            <li>About</li>
            <li className="active">Subscription</li>
            <li>Device</li>
          </ol>
        </nav>
      </aside>

      <div className="right-content">
        <div className="page-header">
          <div>
            <h1 className="section-title">Subscription plan</h1>
            <div className="note">Choose a plan that best fits your listing.</div>
          </div>

          {/* Saved micro-indicator */}
          <div className="save-indicator" aria-hidden>
            {savedTick ? "Saved ✓" : ""}
          </div>
        </div>

        <div className="plan-grid" role="list">
          <PlanCard
            id="just"
            title="Just mates"
            features={["Bring your own GPS", "You report mileage", "In-person key handover"]}
            price="Free"
            selected={sub.plan === "just"}
            onSelect={(id) => dispatch(selectPlan(id))}
          />
          <PlanCard
            id="good"
            title="Good mates"
            features={["Primary GPS included", "Automated mileage", "In-person key handover"]}
            price="$10 / month"
            selected={sub.plan === "good"}
            onSelect={(id) => dispatch(selectPlan(id))}
          />
          <PlanCard
            id="best"
            title="Best mates"
            features={["Keyless access", "Automated mileage", "Remote handover"]}
            price="$30 / month"
            selected={sub.plan === "best"}
            onSelect={(id) => dispatch(selectPlan(id))}
          />
        </div>

        <section className="addons" aria-label="Add-ons">
          <h3 style={{ marginTop: 20 }}>Select add-ons</h3>
          <AddOnCheckbox
            id="secondaryGPS"
            label="BYO secondary GPS - $5/month"
            checked={!!sub.addOns.find((a) => a.id === "secondaryGPS")?.enabled}
            onToggle={(id) => dispatch(toggleAddOn(id))}
          />
          <AddOnCheckbox
            id="tripInsurance"
            label="Between trip insurance (Coming soon)"
            checked={!!sub.addOns.find((a) => a.id === "tripInsurance")?.enabled}
            disabled
            onToggle={() => {}}
          />
        </section>

        <section className="card-section" aria-label="Card visual">
          <h3 style={{ marginTop: 20 }}>Payment (visual only)</h3>
          <div className="card-visual">
            <div style={{ fontSize: 14, color: "#9aa" }}>•••• •••• •••• 1234 &nbsp;&nbsp; 12/25</div>
            <div className="note">No charges will be made — this is a visual card used to match design and persisted locally.</div>
          </div>
        </section>
      </div>
    </section>
  );
};

export default SubscriptionPage;
