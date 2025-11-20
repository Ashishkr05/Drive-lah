// src/store/subscriptionSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./index";

/**
 * Subscription slice
 * - plan is null by default (no selection)
 * - addOns derived from MASTER_ADDONS filtered by plan availability
 * - selecting a plan regenerates visible addOns (all disabled)
 * - restoreSubscription merges incoming persisted flags but always filters addOns to those valid for the plan
 * - persistent save/load via localStorage, robust to malformed data
 */

const STORAGE_KEY = "drive_listing_subscription_v1";

export type PlanType = "just" | "good" | "best" | null;

export type AddOn = {
  id: string;
  label: string;
  enabled: boolean;
  comingSoon?: boolean;
};

type MasterAddOn = Omit<AddOn, "enabled"> & { availableOn: Exclude<PlanType, null>[] };

/* MASTER LIST
   - addon-5 -> available on just, good, and best (user requested $5 present for best)
   - addon-10 -> available on good only (removed from best as requested)
   - addon-pro (coming soon) -> available on best
*/
const MASTER_ADDONS: MasterAddOn[] = [
  { id: "addon-5", label: "BYO secondary GPS - $5/month", comingSoon: false, availableOn: ["just", "good", "best"] },
  { id: "addon-10", label: "BYO lockbox - $10/month", comingSoon: false, availableOn: ["good"] }, // removed from 'best'
  { id: "addon-pro", label: "Between trip insurance", comingSoon: true, availableOn: ["best"] },
];

type SubscriptionState = {
  plan: PlanType;
  addOns: AddOn[]; // visible add-ons for selected plan
};

const defaultState: SubscriptionState = {
  plan: null,
  addOns: [],
};

function safeParse(raw: string | null): any | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Build add-ons for a plan; use persisted enabled flags when provided. If plan is null -> [] */
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

    const planCandidate = parsed.plan;
    const plan: PlanType =
      planCandidate === "just" || planCandidate === "good" || planCandidate === "best" ? planCandidate : null;

    const incomingAddOns: AddOn[] = Array.isArray(parsed.addOns)
      ? parsed.addOns.map((a) => ({
          id: String(a.id),
          label: String(a.label ?? ""),
          enabled: Boolean(a.enabled),
          comingSoon: Boolean(a.comingSoon),
        }))
      : [];

    const addOns = buildAddOnsForPlan(plan, incomingAddOns);
    return { plan, addOns };
  } catch {
    return defaultState;
  }
}

function saveState(s: SubscriptionState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ plan: s.plan, addOns: s.addOns }));
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
      // rebuild visible add-ons for the plan (all disabled by default unless persisted enabled flags merged)
      state.addOns = buildAddOnsForPlan(newPlan);
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

    restoreSubscription(state, action: PayloadAction<Partial<SubscriptionState>>) {
      const payload = action.payload;
      const planCandidate = payload.plan;
      const plan: PlanType =
        planCandidate === "just" || planCandidate === "good" || planCandidate === "best" ? planCandidate : null;
      state.plan = plan;

      const incomingAddOns = Array.isArray(payload.addOns) ? payload.addOns : [];
      state.addOns = buildAddOnsForPlan(plan, incomingAddOns);
      saveState(state);
    },

    resetSubscription(state) {
      state.plan = defaultState.plan;
      state.addOns = defaultState.addOns;
      saveState(state);
    },
  },
});

export const { selectPlan, toggleAddOn, setAddOn, restoreSubscription, resetSubscription } = slice.actions;

export default slice.reducer;

/* Typed selector */
export const selectSubscription = (s: RootState): SubscriptionState => s.subscription as SubscriptionState;

/* Helper: visible add-on ids for a plan */
export const visibleAddOnIdsForPlan = (plan: PlanType): string[] => {
  if (!plan) return [];
  return MASTER_ADDONS.filter((m) => m.availableOn.includes(plan)).map((m) => m.id);
};

/* Helper: whether an add-on counts as "paid" (requires card when enabled) */
export const addOnRequiresCard = (id: string) => id === "addon-5" || id === "addon-10";

/* Selector: should show card details? true when plan is good/best OR any enabled paid add-on */
export const selectShouldShowCardDetails = (s: RootState) => {
  const sub = selectSubscription(s);
  if (sub.plan === "good" || sub.plan === "best") return true;
  return sub.addOns.some((a) => a.enabled && !a.comingSoon && addOnRequiresCard(a.id));
};
