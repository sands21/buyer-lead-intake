// Enumerations modeled as string literal unions for zero runtime cost
export type City = "Chandigarh" | "Mohali" | "Zirakpur" | "Panchkula" | "Other";
export type PropertyType = "Apartment" | "Villa" | "Plot" | "Office" | "Retail";
export type BHK = "1" | "2" | "3" | "4" | "Studio";
export type Purpose = "Buy" | "Rent";
export type Timeline = "0-3m" | "3-6m" | ">6m" | "Exploring";
export type Source = "Website" | "Referral" | "Walk-in" | "Call" | "Other";
export type Status =
  | "New"
  | "Qualified"
  | "Contacted"
  | "Visited"
  | "Negotiation"
  | "Converted"
  | "Dropped";

// Core Buyer record (mirrors DB columns)
export interface Buyer {
  id: string; // UUID
  full_name: string;
  email?: string | null;
  phone: string; // 10-15 digits per constraint
  city: City;
  property_type: PropertyType;
  bhk?: BHK | null;
  purpose: Purpose;
  budget_min?: number | null;
  budget_max?: number | null;
  timeline: Timeline;
  source: Source;
  status: Status; // defaults to "New" in DB
  notes?: string | null;
  tags: string[]; // defaults to [] in DB
  owner_id: string; // UUID
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// Payload for creating a buyer (server assigns owner_id, id, timestamps)
export type BuyerCreateInput = {
  full_name: string;
  email?: string | null;
  phone: string;
  city: City;
  property_type: PropertyType;
  bhk?: BHK | null;
  purpose: Purpose;
  budget_min?: number | null;
  budget_max?: number | null;
  timeline: Timeline;
  source: Source;
  status?: Status; // optional; default "New"
  notes?: string | null;
  tags?: string[];
};

// Payload for updating a buyer (partial updates)
export type BuyerUpdateInput = Partial<Omit<BuyerCreateInput, never>>;

// Change history record
export interface BuyerHistory {
  id: string; // UUID
  buyer_id: string; // UUID
  changed_by: string; // UUID
  changed_at: string; // ISO timestamp
  diff: Record<string, unknown>;
}
