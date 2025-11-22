import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setPayment, clearPayment } from "../store/subscriptionSlice";

type Props = {
  existing?: {
    masked: string;
    last4: string;
    expMonth: string;
    expYear: string;
  } | null;
};

const formatMasked = (num: string) => {
  const clean = num.replace(/\D/g, "");
  if (!clean) return "";
  const groups = clean.match(/.{1,4}/g) || [];
  if (groups.length <= 1) return groups.join(" ");
  const first = groups[0];
  const last = groups[groups.length - 1];
  return `${first} **** **** ${last}`;
};

const simpleValidate = (num: string, mm: string, yy: string, cvc: string) => {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 12) return false;
  const m = Number(mm);
  const y = Number(yy);
  if (!m || m < 1 || m > 12) return false;
  if (!y || yy.length < 2) return false;
  const c = cvc.replace(/\D/g, "");
  if (c.length < 3) return false;
  return true;
};

const CardDetails: React.FC<Props> = ({ existing = null }) => {
  const dispatch = useDispatch();

  const [cardRaw, setCardRaw] = useState<string>("");
  const [cardVisible, setCardVisible] = useState<string>("");

  const [mm, setMm] = useState<string>(existing?.expMonth ?? "");
  const [yy, setYy] = useState<string>(existing?.expYear ?? "");
  const [cvc, setCvc] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [savedMask, setSavedMask] = useState<string | null>(existing?.masked ?? null);

  useEffect(() => {
    if (existing?.masked) {
      setCardVisible(existing.masked);
      setCardRaw("");
      setMm(existing.expMonth ?? "");
      setYy(existing.expYear ?? "");
      setSavedMask(existing.masked);
    }
  }, [existing?.masked]);

  const onCardChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const groups = digits.match(/.{1,4}/g) || [];
    const visible = groups.join(" ");
    setCardVisible(visible);
    setCardRaw(digits);
    setError(null);
    setSavedMask(null);
  };

  const onSave = () => {
    if (!simpleValidate(cardRaw || "", mm, yy, cvc)) {
      setError("Please enter valid card details (card, expiry MM/YY, CVC).");
      return;
    }

    const last4 = (cardRaw || "").slice(-4);
    const masked = formatMasked(cardRaw || "");
    const payload = {
      masked,
      last4,
      expMonth: mm,
      expYear: yy,
      savedAt: Date.now(),
    };

    dispatch(setPayment(payload));
    setSavedMask(masked);
    setCvc("");
    setError(null);
  };

  const onClear = () => {
    dispatch(clearPayment());
    setSavedMask(null);
    setCardRaw("");
    setCardVisible("");
    setMm("");
    setYy("");
    setCvc("");
    setError(null);
  };

  return (
    <div className="card-visual card-visual-inline" aria-live="polite">
      <div className="card-inline-row" style={{ alignItems: "center", gap: 12 }}>
        <div className="card-input group-card-number" style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="1234 5678 1234 5678"
            value={cardVisible}
            onChange={(e) => onCardChange(e.target.value)}
            className="card-input-field"
            aria-label="Card number"
            maxLength={23}
            style={{ minWidth: 280, flex: "1 1 auto" }}
          />

          <input
            type="text"
            inputMode="numeric"
            placeholder="MM"
            value={mm}
            onChange={(e) => setMm(e.target.value.replace(/\D/g, "").slice(0, 2))}
            className="card-input-field small"
            aria-label="Expiry month"
            style={{ width: 84, flex: "0 0 84px" }}
          />

          <input
            type="text"
            inputMode="numeric"
            placeholder="YY"
            value={yy}
            onChange={(e) => setYy(e.target.value.replace(/\D/g, "").slice(0, 2))}
            className="card-input-field small"
            aria-label="Expiry year"
            style={{ width: 84, flex: "0 0 84px" }}
          />

          <input
            type="password"
            inputMode="numeric"
            placeholder="CVC"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="card-input-field small cvc"
            aria-label="CVC"
            style={{ width: 76, flex: "0 0 76px" }}
          />
        </div>

        <div className="card-actions" style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={onSave}
            className="btn save-card"
            aria-label="Save card"
            style={{ background: "#ffd84b", border: "none", padding: "8px 14px", borderRadius: 6, fontWeight: 700, color: "#083233" }}
          >
            Save card
          </button>

          <button
            type="button"
            onClick={onClear}
            className="btn clear-card"
            aria-label="Clear card"
            style={{ background: "#f3f3f3", border: "1px solid #e6e6e6", padding: "8px 12px", borderRadius: 6 }}
          >
            {savedMask ? "Remove" : "Clear"}
          </button>
        </div>
      </div>

      {savedMask && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, color: "#6b7f7f" }}>Saved card preview</div>
          <div style={{ padding: "8px 10px", border: "1px solid #eee", borderRadius: 6, display: "inline-block", marginTop: 6, color: "#4b7f7f" }}>
            {savedMask} &nbsp; {mm && yy ? `${mm}/${yy}` : ""}
          </div>
        </div>
      )}

      {error && <div className="card-error" style={{ color: "#b00020", marginTop: 8 }}>{error}</div>}

      <div className="help-small" style={{ color: "#7c7c7c", fontSize: 12, marginTop: 8 }}>
        You will not be charged right now. Only masked card is saved for preview.
      </div>
    </div>
  );
};

export default CardDetails;
