CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  bank text,
  status text CHECK (status IN ('rented','vacant','planned')),
  rent_amount numeric DEFAULT 0,
  estimated_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE mortgages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  bank text,
  outstanding_balance numeric DEFAULT 0,
  monthly_payment numeric DEFAULT 0,
  interest_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  month date NOT NULL,
  rent_received numeric DEFAULT 0,
  mortgage_payment numeric DEFAULT 0,
  net_cashflow numeric DEFAULT 0,
  status text CHECK (status IN ('paid','pending','missing')),
  created_at timestamptz DEFAULT now()
);

-- Tvá reálná data
INSERT INTO properties (name, address, bank, status, rent_amount, estimated_value) VALUES
  ('Hostivice', 'Hostivice', 'ČSOB', 'rented', 17362, 3500000),
  ('Zahálka Modřany', 'Praha - Modřany', 'ČSOB', 'rented', 21400, 6200000),
  ('Most Javorová', 'Most', 'Moneta', 'vacant', 0, 1400000),
  ('Cukrovar Praha 12', 'Praha 12', null, 'planned', 0, 8000000);
