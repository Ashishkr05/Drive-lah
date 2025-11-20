// src/pages/SubscriptionPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import PlanCard from "../components/PlanCard";
import AddOnCheckbox from "../components/AddOnCheckbox";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store";
import {
  selectPlan,
  toggleAddOn,
  restoreSubscription,
  selectSubscription,
  selectShouldShowCardDetails,
  visibleAddOnIdsForPlan,
} from "../store/subscriptionSlice";
import LeftSteps from "../components/LeftSteps";
import MobileDropdown from "../components/MobileDropdown";

const LOCAL_KEY = "drive_listing_subscription_v1";

const SubscriptionPage: React.FC = () => {
  // use typed selectors from the slice
  const sub = useSelector((s: RootState) => selectSubscription(s));
  const showCardDetailsGlobal = useSelector((s: RootState) => selectShouldShowCardDetails(s));
  const dispatch = useDispatch();

  const planData = [
    {
      id: "just" as const,
      title: "Just mates",
      features: [
        "Bring your own GPS",
        "Mileage reporting to be done by you",
        "In-person key handover to guests",
      ],
      price: "Free",
    },
    {
      id: "good" as const,
      title: "Good mates",
      features: [
        "Primary GPS included",
        "Automated mileage calculations",
        "In-person key handover to guests",
      ],
      price: "$10/month",
    },
    {
      id: "best" as const,
      title: "Best mates",
      features: [
        "Keyless access technology",
        "Automated mileage calculations",
        "Remote handover to guests",
      ],
      price: "$30/month",
    },
  ];

  // restore persisted subscription on mount (slice already loads initial state, but we keep restore for explicit merge)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.plan || parsed.addOns)) {
        dispatch(
          restoreSubscription({
            plan: parsed.plan ?? null,
            addOns: parsed.addOns ?? [],
          })
        );
      }
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // inline responsive grid style to reduce wrapping on wide screens
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const planGridStyle = useMemo(() => {
    if (viewportWidth >= 1200) return { gridTemplateColumns: "repeat(3, minmax(300px, 1fr))" } as React.CSSProperties;
    if (viewportWidth >= 920) return { gridTemplateColumns: "repeat(3, minmax(260px, 1fr))" } as React.CSSProperties;
    return { gridTemplateColumns: "1fr" } as React.CSSProperties;
  }, [viewportWidth]);

  // which add-ons are visible for the current plan (slice already filters and returns only the relevant ones)
  const shouldShowAddons = !!sub.plan && Array.isArray(sub.addOns) && sub.addOns.length > 0;

  return (
    <section className="subscription-wrap" aria-labelledby="subscription-heading">
      <LeftSteps
        active="Subscription"
        completed={[
          "Location",
          "About",
          "Features",
          "Rules",
          "Pricing",
          "Promotion",
          "Pictures",
          "Insurance",
        ]}
      />

      <div className="right-content">
        {/*
          FIXED: pass a static "Subscription" label to the MobileDropdown so mobile header box reads
          "Subscription" (matching target). Do NOT pass the selected plan id here — otherwise
          the dropdown shows 'good' or 'best' which is not desired.
        */}
        <MobileDropdown value="Subscription" onOpen={() => { /* no-op for now */ }} />

        <div className="card page-card first-card-mobile" role="region" aria-labelledby="subscription-heading">
          <div className="card-body">
            <h2 id="subscription-heading" className="section-heading">Subscription plan</h2>

            <p className="sub-note">Select the ideal subscription plan for your listing.</p>

            <h3 className="small-heading">Select your plan</h3>

            <div className="plan-grid" role="list" style={planGridStyle}>
              {planData.map((p) => (
                <PlanCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  features={p.features}
                  priceLabel={p.price}
                  selected={sub.plan === p.id}
                  onSelect={(id) => dispatch(selectPlan(id))}
                />
              ))}
            </div>

            <div className="divider" />

            {/* Add-ons (only visible when a plan is selected) */}
            {shouldShowAddons && (
              <>
                <h3 className="small-heading">Select add-ons for your subscription</h3>
                <div className="addons-row" role="list">
                  {sub.addOns.map((a) => (
                    <AddOnCheckbox
                      key={a.id}
                      id={a.id}
                      label={a.label}
                      checked={a.enabled}
                      disabled={!!a.comingSoon}
                      comingSoon={!!a.comingSoon}
                      onToggle={(id) => dispatch(toggleAddOn(id))}
                    />
                  ))}
                </div>
                <div className="divider" />
              </>
            )}

            {/* Card details: show only if plan requires payment OR a paid addon is enabled.
                This selector comes from your slice logic (selectShouldShowCardDetails) */}
            {showCardDetailsGlobal && (
              <>
                <h3 className="small-heading">Add card details</h3>
                <div className="card-visual" aria-hidden>
                  <div className="card-mock">1234 5678 1234 5678 &nbsp;&nbsp; MM/YY &nbsp; CVC</div>
                  <p className="help-note">You will not be charged right now. Subscription will only start once your listing is published and live.</p>
                </div>
                <div className="divider" />
              </>
            )}

            <div className="learn-more">
              <a href="#">What is the right plan for me?</a>
              <p>Speak to our host success team if you need any clarifications.</p>
            </div>
          </div>
        </div>

        <div className="bottom-cta-mobile" aria-hidden={false}>
          <button className="btn desktop-hidden next-btn-mobile" type="button" aria-label="Next">Next</button>
        </div>

        <div className="desktop-cta">
          <button className="btn next-btn-desktop" type="button" aria-label="Next">Next</button>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPage;
