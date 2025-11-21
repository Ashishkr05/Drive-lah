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
     - Adds `subscription-mobile` to <body> when this page is mounted on a mobile viewport
     - Removes it on unmount
     - Also listens for resize so changing orientation/size toggles behavior while on page
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

    // apply initially
    applyIfMobile();

    // listen for resize and toggle class as needed
    const onResize = () => applyIfMobile();
    window.addEventListener("resize", onResize, { passive: true });

    // cleanup when leaving this page
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
  const planGridStyle = useMemo(() => {
    if (viewportWidth >= 1200) return { gridTemplateColumns: "repeat(3, minmax(300px, 1fr))" } as React.CSSProperties;
    if (viewportWidth >= 920) return { gridTemplateColumns: "repeat(3, minmax(260px, 1fr))" } as React.CSSProperties;
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
    // require exact 2-digit month and year strings (user must input '05', '26' etc.)
    const mmOk = expMonth.length === 2 && mm >= 1 && mm <= 12;
    const yyOk = expYear.length === 2 && yy >= 0 && yy <= 99;
    const panOk = digits.length >= 12 && digits.length <= 19;
    const cvcOk = cvcDigits.length >= 3 && cvcDigits.length <= 4;
    return panOk && mmOk && yyOk && cvcOk;
  }

  // Determine if any paid add-on is selected (slice addOns already limited to plan)
  const hasPaidAddOnSelected = sub.addOns.some((a) => a.enabled && !a.comingSoon && (a.id === "addon-5" || a.id === "addon-10"));

  // Decision: whether card details are required for enabling Next
  const cardRequired = showCardDetailsGlobal; // uses selector from slice (plan good/best OR enabled paid addon)

  // Plan must be selected
  const planSelected = !!sub.plan;

  // final canProceed: plan selected AND (if card required -> card valid) otherwise OK
  const canProceed = planSelected && (!cardRequired || isCardValid());

  // Persist subscription + masked payment preview to local storage & set slice payment
  function persistCurrentStateToLocal(markStepCompleted = false) {
    try {
      // derive digits (if user typed masked string keep last digits found)
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

      // preserve existing root payload shape if present
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

      // write
      localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));

      if (payment) {
        // update slice with masked preview
        dispatch(setPayment(payment as any));
      }

      // debug console (optional)
      // console.debug("[Persist] wrote", payload);
    } catch (err) {
      // ignore
    }
  }

  // Next CTA handler: only act if canProceed
  function handleNextClick() {
    if (!canProceed) {
      // validation failed, do nothing
      return;
    }
    // persist and mark subscription step completed
    persistCurrentStateToLocal(true);

    // request navigation: prefer onNavigate prop (from App), fallback to nothing
    if (typeof onNavigate === "function") {
      onNavigate("device");
    }
  }

  // format card number as user types (groups of 4)
  function formatCardInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

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

            {/* Add-ons */}
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
                <div className="divider" />
              </>
            )}

            {/* Card details collapsible */}
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

            <div className="divider" />

            <div className="learn-more">
              <a href="#">What is the right plan for me?</a>
              <p>Speak to our host success team if you need any clarifications.</p>
            </div>
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
