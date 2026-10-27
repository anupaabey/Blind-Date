export type Applicant = {
  id: string;
  first_name: string;
  display_name: string;
  gender: string;
  dob: string;
  district: string;
  city: string;
  status: string;
  is_demo: boolean;
  matching_enabled: boolean;
  email: string;
  email_verified: boolean;
  phone_verified: boolean;
  answer_count: number;
  review_note: string | null;
  residency_reviewed_at: string | null;
};
export type Recommendation = {
  id: string;
  user_a: string;
  user_b: string;
  score: number;
  status: string;
  breakdown: Record<string, number>;
};
export type Invitation = {
  id: string;
  recommendation_id: string;
  status: string;
  expires_at: string;
};
export type Decision = { invitation_id: string; user_id: string; accepted: boolean };
export type Booking = {
  id: string;
  user_id: string;
  date_at: string;
  status: string;
  note: string;
  partner_venues: { name: string; city: string };
  date_packages: { name: string };
};
export type Venue = {
  id: string;
  name: string;
  district: string;
  city: string;
  address: string;
  contact: string;
  active: boolean;
  vetted: boolean;
  is_demo: boolean;
};
export type Payment = {
  id: string;
  user_id: string | null;
  created_at: string;
  mode: string;
  status: string;
  amount_lkr: number;
  provider_id: string | null;
};
export type Package = { id: string; name: string; price_lkr: number; active: boolean };
export type Report = {
  id: string;
  user_id: string | null;
  reported_id: string | null;
  status: string;
  reason: string;
};
export type Audit = {
  id: number;
  admin_id: string;
  created_at: string;
  action: string;
  target_id: string;
  detail: string;
};
export type Contact = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};
