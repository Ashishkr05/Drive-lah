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
  setPayment,
} from "../store/subscriptionSlice";
import LeftSteps from "../components/LeftSteps";
import MobileDropdown from "../components/MobileDropdown";

type OnNavigateFn = (target: "subscription" | "device") => void;

const LOCAL_KEY = "drive_listing_state_v1";

interface Props {
  onNavigate?: OnNavigateFn;
}

const SubscriptionPage: React.FC<Props> = ({ onNavigate }) => {
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

  // Restore persisted subscription on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.subscription || parsed.payment)) {
        dispatch(
          restoreSubscription({
            plan: parsed.subscription?.plan ?? null,
            addOns: parsed.subscription?.addOns ?? [],
            payment: parsed.subscription?.payment ?? parsed.payment ?? null,
          } as any)
        );
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------
     NEW: subscription-mobile body class (mobile-only header effect)
  ------------------------ */
  useEffect(() => {
    const MOBILE_BREAKPOINT = 919;
    const applyIfMobile = () => {
      try {
        if (typeof window === "undefined") return;
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
          document.body.classList.add("subscription-mobile");
        } else {
          document.body.classList.remove("subscription-mobile");
        }
      } catch {}
    };

    applyIfMobile();
    const onResize = () => applyIfMobile();
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      try {
        window.removeEventListener("resize", onResize);
      } catch {}
      try {
        document.body.classList.remove("subscription-mobile");
      } catch {}
    };
  }, []);
  /* ------------------------- end NEW ------------------------- */

  // Responsive grid inline style to reduce feature wrapping
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // NOTE: use minmax(0, 1fr) to avoid grid children forcing container overflow
  const planGridStyle = useMemo(() => {
    if (viewportWidth >= 1200) return { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" } as React.CSSProperties;
    if (viewportWidth >= 920) return { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" } as React.CSSProperties;
    return { gridTemplateColumns: "1fr" } as React.CSSProperties;
  }, [viewportWidth]);

  // Card input local state
  const [cardNumber, setCardNumber] = useState<string>("");
  const [expMonth, setExpMonth] = useState<string>("");
  const [expYear, setExpYear] = useState<string>("");
  const [cvc, setCvc] = useState<string>("");

  // load masked preview if present
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const mask =
        data?.subscription?.payment?.masked ??
        data?.payment?.masked ??
        data?.cardMask ??
        data?.subscription?.payment?.masked;
      if (mask && typeof mask === "string") setCardNumber(mask);
      const month = data?.subscription?.payment?.expMonth ?? data?.payment?.expMonth ?? data?.cardExpMonth;
      const year = data?.subscription?.payment?.expYear ?? data?.payment?.expYear ?? data?.cardExpYear;
      if (month) setExpMonth(String(month).padStart(2, "0"));
      if (year) setExpYear(String(year));
    } catch {
      // ignore
    }
  }, []);

  // mask PAN for storage
  function maskPan(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 8) {
      const first = digits.slice(0, 4);
      const last = digits.slice(-4);
      const middleCount = Math.max(4, digits.length - 8);
      return `${first} ${"•".repeat(middleCount)} ${last}`;
    }
    if (digits.length === 0) return "";
    return digits.replace(/\d(?=\d{4})/g, "•");
  }

  // improved validation: require MM and YY to be two-digit strings
  function isCardValid() {
    const digits = cardNumber.replace(/\D/g, "");
    const mm = Number(expMonth);
    const yy = Number(expYear);
    const cvcDigits = cvc.replace(/\D/g, "");
    const mmOk = expMonth.length === 2 && mm >= 1 && mm <= 12;
    const yyOk = expYear.length === 2 && yy >= 0 && yy <= 99;
    const panOk = digits.length >= 12 && digits.length <= 19;
    const cvcOk = cvcDigits.length >= 3 && cvcDigits.length <= 4;
    return panOk && mmOk && yyOk && cvcOk;
  }

  // Determine if any paid add-on is selected (slice addOns already limited to plan)
  const hasPaidAddOnSelected = sub.addOns.some((a) => a.enabled && !a.comingSoon && (a.id === "addon-5" || a.id === "addon-10"));

  // Decision: whether card details are required for enabling Next
  const cardRequired = showCardDetailsGlobal;

  // Plan must be selected
  const planSelected = !!sub.plan;

  // final canProceed: plan selected AND (if card required -> card valid) otherwise OK
  const canProceed = planSelected && (!cardRequired || isCardValid());

  // Persist subscription + masked payment preview to local storage & set slice payment
  function persistCurrentStateToLocal(markStepCompleted = false) {
    try {
      const digits = (cardNumber || "").replace(/\D/g, "");
      const last4 = digits.slice(-4) || "";
      const payment =
        cardRequired && digits.length >= 3
          ? {
              masked: maskPan(cardNumber),
              last4: last4,
              expMonth: String(expMonth).padStart(2, "0"),
              expYear: String(expYear),
              savedAt: Date.now(),
            }
          : null;

      const raw = localStorage.getItem(LOCAL_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      const existingCompleted: string[] = (existing?.subscription?.completedSteps as string[]) || (existing?.completedSteps as string[]) || [];
      const nextCompleted = markStepCompleted
        ? Array.from(new Set([...existingCompleted, "Subscription"]))
        : existingCompleted;

      const payload = {
        ...existing,
        subscription: {
          plan: sub.plan,
          addOns: sub.addOns,
          payment: payment,
          completedSteps: nextCompleted,
        },
        completedSteps: nextCompleted,
        timestamp: Date.now(),
      };

      localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));

      if (payment) {
        dispatch(setPayment(payment as any));
      }
    } catch (err) {
      // ignore
    }
  }

  // Next CTA handler: only act if canProceed
  function handleNextClick() {
    if (!canProceed) {
      return;
    }
    persistCurrentStateToLocal(true);
    if (typeof onNavigate === "function") {
      onNavigate("device");
    }
  }

  // format card number as user types (groups of 4)
  function formatCardInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  // Main block content (everything except heading/sub-note)
  const innerContent = (
    <>
      <h3 className="small-heading">Select your plan</h3>

      <div className="plan-grid" role="list" style={planGridStyle}>
      {planData.map((p) => {
        // split price string into amount + unit if string format is "$10/month"
        const priceText = typeof p.price === "string" ? p.price : String(p.price);
        const [amount, unit] = priceText.split(/(\/.*)/).map((s) => (s ? s.trim() : ""));

        // build a node so we can style amount and unit separately
        const priceNode = (
          <span className="plan-price" aria-hidden>
            <span className="plan-price-amount">{amount}</span>
            {unit ? <span className="plan-price-unit">{unit}</span> : null}
          </span>
        );

        return (
          <PlanCard
            key={p.id}
            id={p.id}
            title={p.title}
            features={p.features}
            // cast to any to avoid strict Prop type issues if PlanCard expects string
            priceLabel={priceNode as any}
            selected={sub.plan === p.id}
            onSelect={(id) => dispatch(selectPlan(id))}
          />
        );
      })}
    </div>


      {/* Show this divider only when card details are visible */}
      {<div className="divider" />}

      {sub.plan && Array.isArray(sub.addOns) && sub.addOns.length > 0 && (
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
          {/* keep this divider inside the add-ons block as before (no change) */}
          <div className="divider" />
        </>
      )}

      <div className={`collapsible ${showCardDetailsGlobal ? "open" : ""}`} aria-hidden={!showCardDetailsGlobal}>
        <div className="collapsible-inner">
          {showCardDetailsGlobal && (
            <>
              <h3 className="small-heading">Add card details</h3>

              <div className="card-visual" aria-hidden={false}>
                <div className="card-input-box" role="group" aria-label="Card details">
                  <div className="card-input-icon" aria-hidden>
                    <svg width="18" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <rect x="1.5" y="4.5" width="21" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" />
                      <rect x="3.5" y="8" width="3.5" height="2" rx="0.6" fill="currentColor" />
                    </svg>
                  </div>

                  <input
                    className="card-input card-number"
                    aria-label="Card number"
                    inputMode="numeric"
                    placeholder="1234 5678 1234 5678"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                  />

                  <div className="card-input-mini">
                    <input
                      className="card-input card-mm"
                      aria-label="Expiry month"
                      placeholder="MM"
                      value={expMonth}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                        setExpMonth(v);
                      }}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="card-input-mini">
                    <input
                      className="card-input card-yy"
                      aria-label="Expiry year"
                      placeholder="YY"
                      value={expYear}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                        setExpYear(v);
                      }}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="card-input-mini">
                    <input
                      className="card-input card-cvc"
                      aria-label="CVC"
                      placeholder="CVC"
                      value={cvc}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setCvc(v);
                      }}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <p className="help-note">You will not be charged right now. Subscription will only start once your listing is published and live.</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Show this divider only when card details are visible */}
      {showCardDetailsGlobal && <div className="divider" />}

      <div className="learn-more">
        <div className="learn-more-top">
          <span className="learn-more-lead">Learn more about the plans here -</span>
          <a className="learn-more-link" href="#">What is the right plan for me?</a>
        </div>

        <p className="learn-more-desc">
          You will be able to switch between plans easily later as well. Speak to our host success team if you need any clarifications.
        </p>
      </div>
    </>
  );

  // Desktop-only wrapper styles (inline to avoid touching global scss)
  const desktopFrameStyle: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 8,
    padding: 20,
    marginTop: 12,
    boxSizing: "border-box",
    width: "100%",
    // ensure grid children wrap inside; avoid clipping but prevent overflow pushing out of parent
    overflow: "visible",
    background: "white",
    boxShadow: "0 6px 18px rgba(13,13,13,0.04)",
  };

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
        {/* static label so mobile dropdown shows "Subscription" not the selected plan */}
        <MobileDropdown value="Subscription" onOpen={() => {}} />

        <div className="card page-card first-card-mobile" role="region">
          <div className="card-body">
            {/** Render heading + sub-note inside the desktop frame for desktop,
                but keep the mobile layout unchanged (heading outside frame) */}
            {viewportWidth >= 920 ? (
              <div className="desktop-frame" style={desktopFrameStyle}>
                <h2 id="subscription-heading" className="section-heading">Subscription plan</h2>
                <p className="sub-note">Select the ideal subscription plan for your listing.</p>

                {/* FULL-WIDTH HORIZONTAL LINE — desktop only */}
                {viewportWidth >= 920 && <div className="desktop-top-divider" />}

                {innerContent}
              </div>
            ) : (
              <>
                <h2 id="subscription-heading" className="section-heading">Subscription plan</h2>
                <p className="sub-note">Select the ideal subscription plan for your listing.</p>
                {innerContent}
              </>
            )}

          </div>
        </div>

        {/* mobile bottom CTA */}
        <div className="bottom-cta-mobile" aria-hidden={false}>
          <button
            className={`btn desktop-hidden next-btn-mobile ${!canProceed ? "is-disabled" : ""}`}
            type="button"
            aria-label="Next"
            onClick={handleNextClick}
            disabled={!canProceed}
            aria-disabled={!canProceed}
          >
            Next
          </button>
        </div>

        {/* desktop CTA */}
        <div className="desktop-cta">
          <button
            className={`btn next-btn-desktop ${!canProceed ? "is-disabled" : ""}`}
            type="button"
            aria-label="Next"
            onClick={handleNextClick}
            disabled={!canProceed}
            aria-disabled={!canProceed}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPage;
