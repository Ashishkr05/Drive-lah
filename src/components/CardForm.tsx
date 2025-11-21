// src/components/CardForm.tsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Simple card input component used for the assignment.
 * - Performs Luhn check on PAN
 * - Validates expiry (MM/YY)
 * - Masks card before emitting to parent
 * - Does NOT store CVV
 */

export type MaskedCard = {
  brand?: string | null;
  last4?: string | null;
  masked?: string | null;
  expMonth?: string | null;
  expYear?: string | null;
};

type Props = {
  initial?: MaskedCard | null;
  onSave: (masked: MaskedCard | null) => void;
};

function luhnValidate(num: string) {
  // remove non-digits
  const s = num.replace(/\D/g, "");
  let sum = 0;
  let toggle = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let d = parseInt(s[i], 10);
    if (toggle) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    toggle = !toggle;
  }
  return sum % 10 === 0;
}

function detectBrand(num: string) {
  const s = num.replace(/\D/g, "");
  if (/^4/.test(s)) return "Visa";
  if (/^5[1-5]/.test(s) || /^2(?:2[2-9]|[3-6]\d|7[01])/.test(s)) return "Mastercard";
  return "Card";
}

const CardForm: React.FC<Props> = ({ initial = null, onSave }) => {
  const [pan, setPan] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState<string | null>(null);
  const [savedMask, setSavedMask] = useState<MaskedCard | null>(initial);

  useEffect(() => {
    setSavedMask(initial ?? null);
  }, [initial]);

  const canSubmit = useMemo(() => {
    if (!pan || !expMonth || !expYear) return false;
    if (!luhnValidate(pan)) return false;
    // expiry check
    const mm = Number(expMonth);
    const yy = Number(expYear.length === 2 ? `20${expYear}` : expYear);
    if (isNaN(mm) || mm < 1 || mm > 12) return false;
    const now = new Date();
    if (yy < now.getFullYear()) return false;
    if (yy === now.getFullYear() && mm < now.getMonth() + 1) return false;
    return true;
  }, [pan, expMonth, expYear]);

  function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    setErrors(null);
    if (!canSubmit) {
      setErrors("Please enter valid card details");
      return;
    }
    const brand = detectBrand(pan);
    const last4 = pan.replace(/\D/g, "").slice(-4);
    const masked = `**** **** **** ${last4}`;
    const card: MaskedCard = { brand, last4, masked, expMonth, expYear: expYear.length === 2 ? `20${expYear}` : expYear };
    // Save only masked card (parent will persist)
    setSavedMask(card);
    onSave(card);
  }

  function handleClear() {
    setPan("");
    setExpMonth("");
    setExpYear("");
    setCvv("");
    setSavedMask(null);
    onSave(null);
  }

  return (
    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {savedMask ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700 }}>{savedMask.brand} •••• {savedMask.last4}</div>
            <div style={{ fontSize: 13, color: "#666" }}>Exp: {savedMask.expMonth}/{savedMask.expYear?.slice(-2)}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn" onClick={() => { /* reveal edit */ handleClear(); }} aria-label="Remove saved card">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <>
          <label style={{ fontSize: 13, color: "#333" }}>
            Card number
            <input
              inputMode="numeric"
              value={pan}
              onChange={(e) => setPan(e.target.value)}
              placeholder="4242 4242 4242 4242"
              style={{ display: "block", width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e0e0e0", marginTop: 6 }}
            />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ flex: 1 }}>
              Exp month (MM)
              <input value={expMonth} onChange={(e) => setExpMonth(e.target.value.replace(/[^\d]/g, "").slice(0,2))} placeholder="MM" style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e0e0e0", marginTop: 6 }} />
            </label>
            <label style={{ flex: 1 }}>
              Exp year (YY)
              <input value={expYear} onChange={(e) => setExpYear(e.target.value.replace(/[^\d]/g, "").slice(0,2))} placeholder="YY" style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e0e0e0", marginTop: 6 }} />
            </label>
          </div>

          <label style={{ fontSize: 13, color: "#333" }}>
            CVV
            <input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/[^\d]/g, "").slice(0,4))} placeholder="CVV" style={{ display: "block", width: 140, padding: 10, borderRadius: 6, border: "1px solid #e0e0e0", marginTop: 6 }} />
          </label>

          {errors && <div style={{ color: "crimson", fontSize: 13 }}>{errors}</div>}

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button type="submit" className="btn" disabled={!canSubmit} onClick={handleSave}>Save card</button>
            <button type="button" className="btn" onClick={handleClear}>Clear</button>
          </div>
        </>
      )}
      <div style={{ fontSize: 12, color: "#666" }}>You will not be charged now. Only masked card is saved for preview.</div>
    </form>
  );
};

export default CardForm;
