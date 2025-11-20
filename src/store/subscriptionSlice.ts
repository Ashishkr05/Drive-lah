import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadDraft, saveDraft } from "../utils/localStorage";

type PlanId = "just" | "good" | "best";

interface AddOn { id: string; enabled: boolean; }
interface CardVisual { last4?: string; expiry?: string; name?: string; }
interface SubscriptionState {
  plan?: PlanId;
  addOns: AddOn[];
  cardVisual?: CardVisual;
}

const persisted = (loadDraft()?.subscription ?? undefined) as SubscriptionState | undefined;

const initialState: SubscriptionState = persisted ?? {
  plan: undefined,
  addOns: [
    { id: "secondaryGPS", enabled: false },
    { id: "tripInsurance", enabled: false },
  ],
  cardVisual: undefined,
};

const slice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    selectPlan(state, action: PayloadAction<PlanId>) {
      state.plan = action.payload;
      saveDraft({ subscription: state });
    },
    toggleAddOn(state, action: PayloadAction<string>) {
      const a = state.addOns.find((x) => x.id === action.payload);
      if (a) a.enabled = !a.enabled;
      saveDraft({ subscription: state });
    },
    setCardVisual(state, action: PayloadAction<CardVisual>) {
      state.cardVisual = action.payload;
      saveDraft({ subscription: state });
    },
  },
});

export const { selectPlan, toggleAddOn, setCardVisual } = slice.actions;
export default slice.reducer;
