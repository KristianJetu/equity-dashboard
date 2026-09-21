export type Severity = "critical" | "important" | "opportunity" | "data";
export type Category = "cashflow" | "financing" | "leases" | "debts" | "assets" | "data";

export type RProperty = {
  id: string;
  name: string;
  type?: string | null;
  ownership_type?: string | null;
  status: "rented" | "vacant" | "planned";
  rent_amount: number;
  estimated_value: number;
  monthly_costs?: number | null;
  management_fee?: number | null;
  lease_end?: string | null;
  insurance_to?: string | null;
};

export type RMortgage = {
  id: string;
  property_id: string;
  outstanding_balance: number;
  monthly_payment: number;
  refix_date: string | null;
  interest_rate?: number | null;
  loan_start_date?: string | null;
  loan_term_years?: number | null;
};

export type RPayment = {
  id: string;
  property_id: string | null;
  month: string;
  rent_received: number;
  status: string;
};

export type RDebt = {
  id: string;
  direction: "i_owe" | "they_owe";
  name: string;
  amount_remaining: number;
  monthly_payment?: number | null;
  interest_rate?: number | null;
  note?: string | null;
  due_date?: string | null;
};

export type RProfile = {
  incomeEmployment: number | null;
  incomeOther: number | null;
  householdCosts: number | null;
};

export type RecommendationInput = {
  properties: RProperty[];
  mortgages: RMortgage[];
  payments: RPayment[];
  debts: RDebt[];
  profile: RProfile;
  today?: Date;
};

export type Recommendation = {
  /** Stabilní klíč `pravidlo:objekt` — pro pozdější odložení/vyřešení. */
  id: string;
  rule: string;
  severity: Severity;
  category: Category;
  propertyId: string | null;
  title: string;
  why: string;
  action: string;
  /** Měsíční dopad v Kč (záporné = ztráta); null, když ho nelze spočítat. */
  impactCzkMonth: number | null;
  dueDate: string | null;
  daysLeft: number | null;
};
