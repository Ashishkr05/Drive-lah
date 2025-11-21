// src/store/subscriptionSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./index";

/**
 * Subscription slice with payment preview support stored masked only.
 * Persists to localStorage under "drive_listing_state_v1".
 */

const STORAGE_KEY = "drive_listing_state_v1";

export type PlanType = "just" | "good" | "best" | null;

export type AddOn = {
  id: string;
  label: string;
  enabled: boolean;
  comingSoon?: boolean;
};

type MasterAddOn = Omit<AddOn, "enabled"> & { availableOn: Exclude<PlanType, null>[] };

const MASTER_ADDONS: MasterAddOn[] = [
  // $5 addon visible on just, good, best (you requested $5 for best too)
  { id: "addon-5", label: "BYO secondary GPS - $5/month", comingSoon: false, availableOn: ["just", "good", "best"] },

  // $10 addon visible on good only (removed from best as requested)
  { id: "addon-10", label: "BYO lockbox - $10/month", comingSoon: false, availableOn: ["good"] },

  // coming soon visible on best
  { id: "addon-pro", label: "Between trip insurance", comingSoon: true, availableOn: ["best"] },
];

export type PaymentPreview = {
  masked: string; // e.g. "4242 **** **** 4242"
  last4: string;
  expMonth: string;
  expYear: string;
  savedAt: number;
} | null;

type SubscriptionState = {
  plan: PlanType;
  addOns: AddOn[];
  payment: PaymentPreview;
};

const defaultState: SubscriptionState = {
  plan: null,
  addOns: [],
  payment: null,
};

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function buildAddOnsForPlan(plan: PlanType, persisted?: AddOn[]): AddOn[] {
  if (!plan) return [];
  const applicable = MASTER_ADDONS.filter((m) => m.availableOn.includes(plan));
  return applicable.map((m) => {
    const found = Array.isArray(persisted) ? persisted.find((p) => p.id === m.id) : undefined;
    return {
      id: m.id,
      label: m.label,
      comingSoon: !!m.comingSoon,
      enabled: !!(found && found.enabled),
    } as AddOn;
  });
}

function loadState(): SubscriptionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse(raw);
    if (!parsed || typeof parsed !== "object") return defaultState;

    const planCandidate = parsed.subscription?.plan;
    const plan: PlanType =
      planCandidate === "just" || planCandidate === "good" || planCandidate === "best" ? planCandidate : null;

    const incomingAddOns: AddOn[] = Array.isArray(parsed.subscription?.addOns)
      ? parsed.subscription.addOns.map((a: any) => ({
          id: String(a.id),
          label: String(a.label ?? ""),
          enabled: Boolean(a.enabled),
          comingSoon: Boolean(a.comingSoon),
        }))
      : [];

    const payment = parsed.subscription?.payment ?? null;

    return {
      plan,
      addOns: buildAddOnsForPlan(plan, incomingAddOns),
      payment: payment && payment.last4 ? payment : null,
    };
  } catch {
    return defaultState;
  }
}

function saveState(s: SubscriptionState) {
  try {
    const payload = { subscription: { plan: s.plan, addOns: s.addOns, payment: s.payment } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore localStorage failures
  }
}

const initialState: SubscriptionState = loadState();

const slice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    selectPlan(state, action: PayloadAction<SubscriptionState["plan"]>) {
      const newPlan = action.payload ?? null;
      state.plan = newPlan;
      // regenerate visible add-ons for plan (preserve persisted enables only if they match master)
      state.addOns = buildAddOnsForPlan(newPlan, state.addOns);
      // if plan is free and no paid addons enabled — keep payment as-is (user may have saved), but UI will decide whether to show.
      saveState(state);
    },

    toggleAddOn(state, action: PayloadAction<string>) {
      const id = action.payload;
      const idx = state.addOns.findIndex((a) => a.id === id);
      if (idx >= 0 && !state.addOns[idx].comingSoon) {
        state.addOns[idx].enabled = !state.addOns[idx].enabled;
        saveState(state);
      }
    },

    setAddOn(state, action: PayloadAction<{ id: string; enabled: boolean }>) {
      const { id, enabled } = action.payload;
      const idx = state.addOns.findIndex((a) => a.id === id);
      if (idx >= 0 && !state.addOns[idx].comingSoon) {
        state.addOns[idx].enabled = enabled;
        saveState(state);
      }
    },

    setPayment(state, action: PayloadAction<NonNullable<SubscriptionState["payment"]>>) {
      state.payment = action.payload;
      saveState(state);
    },

    clearPayment(state) {
      state.payment = null;
      saveState(state);
    },

    restoreSubscription(state, action: PayloadAction<Partial<SubscriptionState>>) {
      const payload = action.payload;
      const planCandidate = payload.plan;
      const plan: PlanType = planCandidate === "just" || planCandidate === "good" || planCandidate === "best" ? planCandidate : null;
      state.plan = plan;

      const incomingAddOns = Array.isArray(payload.addOns) ? payload.addOns : [];
      state.addOns = buildAddOnsForPlan(plan, incomingAddOns);

      const incomingPayment = payload.payment ?? null;
      state.payment = incomingPayment && incomingPayment.last4 ? incomingPayment : null;
      saveState(state);
    },

    resetSubscription(state) {
      state.plan = defaultState.plan;
      state.addOns = defaultState.addOns;
      state.payment = defaultState.payment;
      saveState(state);
    },
  },
});

export const { selectPlan, toggleAddOn, setAddOn, setPayment, clearPayment, restoreSubscription, resetSubscription } =
  slice.actions;

export default slice.reducer;

/* selectors */
export const selectSubscription = (s: RootState) => s.subscription as SubscriptionState;

/* helper: whether add-on requires payment */
export const addOnRequiresCard = (id: string) => id === "addon-5" || id === "addon-10";

/* selector: should show card details? plan good/best OR any enabled paid add-on */
export const selectShouldShowCardDetails = (s: RootState) => {
  const sub = selectSubscription(s);
  if (sub.plan === "good" || sub.plan === "best") return true;
  return sub.addOns.some((a) => a.enabled && !a.comingSoon && addOnRequiresCard(a.id));
};

/* helper: visible add-on ids for plan */
export const visibleAddOnIdsForPlan = (plan: PlanType): string[] => {
  if (!plan) return [];
  return MASTER_ADDONS.filter((m) => m.availableOn.includes(plan)).map((m) => m.id);
};
