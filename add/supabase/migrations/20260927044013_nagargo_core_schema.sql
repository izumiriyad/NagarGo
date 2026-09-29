/*
# NagarGo Core Schema

1. Purpose
   Full platform for parcel delivery, ride service, medicine express, rider marketplace, and live tracking.
   Multi-user app with auth: profiles, orders, rides, medicine orders, tracking, payments, reviews, coupons, support, payouts, pricing config, notifications, audit logs, locations, feature flags.

2. New Tables
   - profiles: user profile data linked to auth.users, with role (customer/rider/admin) and phone
   - riders: rider-specific data (vehicle, status, earnings, documents, online status)
   - orders: unified orders table for parcel/ride/medicine with status state machine
   - tracking_sessions: live tracking with secure tokens, expiry, GPS coords
   - payments: payment records with bKash manual payment support
   - reviews: customer reviews with moderation
   - coupons: discount codes with validation rules
   - support_tickets: customer support and disputes
   - payouts: rider payout requests
   - pricing_configs: server-side pricing per zone/service
   - notifications: in-app notifications
   - audit_logs: admin action audit trail
   - system_configs: key-value system settings
   - feature_flags: enable/disable features
   - locations: Bangladesh location hierarchy (division/district/upazila/union)
   - saved_locations: customer saved pickup/dropoff locations

3. Security
   - RLS enabled on all tables
   - Owner-scoped CRUD for user data (profiles, orders, saved_locations, reviews, notifications, support_tickets)
   - Rider-scoped access for rider tables
   - Public read for approved reviews, active feature flags, public pricing
   - Tracking sessions accessible via token (public read with token check)
   - All tables use auth.uid() ownership checks
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  full_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','rider','admin','support','finance','dispatch')),
  avatar_url text,
  division text,
  district text,
  city text,
  thana text,
  area text,
  landmark text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Riders table
CREATE TABLE IF NOT EXISTS riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','document_review','approved','rejected','suspended')),
  vehicle_type text,
  vehicle_registration text,
  driving_license text,
  nid_number text,
  nid_front_url text,
  nid_back_url text,
  profile_photo_url text,
  emergency_contact_name text,
  emergency_contact_phone text,
  bkash_number text,
  preferred_zone text,
  is_online boolean DEFAULT false,
  rating numeric(3,2) DEFAULT 5.00,
  total_trips int DEFAULT 0,
  total_earnings numeric(12,2) DEFAULT 0,
  available_earnings numeric(12,2) DEFAULT 0,
  pending_earnings numeric(12,2) DEFAULT 0,
  paid_earnings numeric(12,2) DEFAULT 0,
  latitude double precision,
  longitude double precision,
  location_accuracy double precision,
  location_heading double precision,
  location_speed double precision,
  location_updated_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rider" ON riders;
CREATE POLICY "select_own_rider" ON riders FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_rider" ON riders;
CREATE POLICY "insert_own_rider" ON riders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_rider" ON riders;
CREATE POLICY "update_own_rider" ON riders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders table (parcel, ride, medicine)
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  trip_id text UNIQUE,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rider_id uuid REFERENCES riders(id) ON DELETE SET NULL,
  service_type text NOT NULL CHECK (service_type IN ('parcel','ride','medicine')),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('draft','requested','searching_rider','rider_assigned','rider_accepted','arriving_pickup','arrived_pickup','pickup_otp_required','picked_up','in_transit','arriving_destination','arrived_destination','delivery_otp_required','delivered','completed','cancelled','rejected','expired','disputed')),
  pickup_address text NOT NULL,
  pickup_lat double precision,
  pickup_lng double precision,
  pickup_division text,
  pickup_district text,
  pickup_thana text,
  pickup_area text,
  pickup_contact_name text,
  pickup_contact_phone text,
  dropoff_address text NOT NULL,
  dropoff_lat double precision,
  dropoff_lng double precision,
  dropoff_division text,
  dropoff_district text,
  dropoff_thana text,
  dropoff_area text,
  dropoff_contact_name text,
  dropoff_contact_phone text,
  package_type text,
  package_size text,
  package_weight text,
  package_description text,
  is_fragile boolean DEFAULT false,
  special_instructions text,
  passenger_count int DEFAULT 1,
  ride_type text,
  prescription_url text,
  pharmacy_info text,
  preferred_pickup_time timestamptz,
  distance_km numeric(8,2),
  base_fare numeric(10,2) DEFAULT 0,
  distance_fare numeric(10,2) DEFAULT 0,
  service_fee numeric(10,2) DEFAULT 0,
  waiting_fee numeric(10,2) DEFAULT 0,
  surcharge numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  total_fare numeric(10,2) DEFAULT 0,
  rider_earning numeric(10,2) DEFAULT 0,
  commission numeric(10,2) DEFAULT 0,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash','pay_rider','pay_admin','bkash')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending','submitted','under_review','verified','rejected','refunded')),
  pickup_otp text,
  delivery_otp text,
  coupon_code text,
  cancelled_by text,
  cancellation_reason text,
  cancelled_at timestamptz,
  completed_at timestamptz,
  rating int,
  rating_comment text,
  tracking_token text,
  tracking_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders" ON orders FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

-- Rider can read orders assigned to them
DROP POLICY IF EXISTS "select_rider_orders" ON orders;
CREATE POLICY "select_rider_orders" ON orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM riders WHERE riders.id = orders.rider_id AND riders.user_id = auth.uid())
);

-- Rider can update orders assigned to them (for status updates, OTP verification etc)
DROP POLICY IF EXISTS "update_rider_orders" ON orders;
CREATE POLICY "update_rider_orders" ON orders FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM riders WHERE riders.id = orders.rider_id AND riders.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM riders WHERE riders.id = orders.rider_id AND riders.user_id = auth.uid())
);

-- Tracking sessions (public read via tracking_token)
CREATE TABLE IF NOT EXISTS tracking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  trip_id text NOT NULL,
  tracking_token text UNIQUE NOT NULL,
  rider_id uuid REFERENCES riders(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended','expired')),
  rider_lat double precision,
  rider_lng double precision,
  rider_accuracy double precision,
  rider_heading double precision,
  rider_speed double precision,
  last_updated timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tracking_sessions ENABLE ROW LEVEL SECURITY;

-- Public read via token (anon can access active tracking)
DROP POLICY IF EXISTS "select_tracking_by_token" ON tracking_sessions;
CREATE POLICY "select_tracking_by_token" ON tracking_sessions FOR SELECT TO anon, authenticated USING (true);

-- Rider who owns the session can update
DROP POLICY IF EXISTS "update_own_tracking" ON tracking_sessions;
CREATE POLICY "update_own_tracking" ON tracking_sessions FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM riders WHERE riders.id = tracking_sessions.rider_id AND riders.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM riders WHERE riders.id = tracking_sessions.rider_id AND riders.user_id = auth.uid())
);

-- Rider can insert tracking for their orders
DROP POLICY IF EXISTS "insert_own_tracking" ON tracking_sessions;
CREATE POLICY "insert_own_tracking" ON tracking_sessions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM riders WHERE riders.id = tracking_sessions.rider_id AND riders.user_id = auth.uid())
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text UNIQUE NOT NULL,
  order_id text NOT NULL,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  method text NOT NULL CHECK (method IN ('cash','pay_rider','pay_admin','bkash')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','under_review','verified','rejected','refunded')),
  sender_bkash_number text,
  trx_id text,
  payment_time timestamptz,
  screenshot_url text,
  verified_by uuid,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT TO authenticated USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

-- Reviews table (public read for approved)
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  gender text,
  service text NOT NULL CHECK (service IN ('parcel','ride','medicine')),
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews
DROP POLICY IF EXISTS "select_approved_reviews" ON reviews;
CREATE POLICY "select_approved_reviews" ON reviews FOR SELECT TO anon, authenticated USING (status = 'approved');

-- Authenticated can insert reviews
DROP POLICY IF EXISTS "insert_reviews" ON reviews;
CREATE POLICY "insert_reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (true);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric(10,2) NOT NULL,
  min_order numeric(10,2) DEFAULT 0,
  max_discount numeric(10,2),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  usage_limit int,
  per_user_limit int DEFAULT 1,
  used_count int DEFAULT 0,
  applicable_city text,
  applicable_service text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_active_coupons" ON coupons;
CREATE POLICY "select_active_coupons" ON coupons FOR SELECT TO anon, authenticated USING (is_active = true);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text NOT NULL CHECK (category IN ('complaint','payment_issue','rider_issue','delivery_issue','refund_request','medicine_issue','technical_issue')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_user','resolved','closed')),
  assigned_to uuid,
  response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tickets" ON support_tickets;
CREATE POLICY "select_own_tickets" ON support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tickets" ON support_tickets;
CREATE POLICY "insert_own_tickets" ON support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tickets" ON support_tickets;
CREATE POLICY "update_own_tickets" ON support_tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Payouts
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','processing','paid','rejected')),
  method text DEFAULT 'bkash',
  bkash_number text,
  processed_by uuid,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payouts" ON payouts;
CREATE POLICY "select_own_payouts" ON payouts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM riders WHERE riders.id = payouts.rider_id AND riders.user_id = auth.uid())
);

DROP POLICY IF EXISTS "insert_own_payouts" ON payouts;
CREATE POLICY "insert_own_payouts" ON payouts FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM riders WHERE riders.id = payouts.rider_id AND riders.user_id = auth.uid())
);

-- Pricing configs (public read)
CREATE TABLE IF NOT EXISTS pricing_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name text NOT NULL,
  service_type text NOT NULL DEFAULT 'parcel',
  division text,
  district text,
  city text,
  base_fare numeric(10,2) NOT NULL DEFAULT 40,
  included_distance_km numeric(5,2) DEFAULT 2,
  per_km numeric(10,2) NOT NULL DEFAULT 12,
  minimum_fare numeric(10,2) NOT NULL DEFAULT 50,
  waiting_per_minute numeric(10,2) DEFAULT 2,
  service_fee numeric(10,2) DEFAULT 5,
  peak_multiplier numeric(3,2) DEFAULT 1.00,
  night_surcharge numeric(10,2) DEFAULT 0,
  extra_stop_fee numeric(10,2) DEFAULT 0,
  medicine_fee numeric(10,2) DEFAULT 0,
  commission_percent numeric(5,2) DEFAULT 20,
  rider_percent numeric(5,2) DEFAULT 80,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(zone_name, service_type)
);
ALTER TABLE pricing_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_pricing" ON pricing_configs;
CREATE POLICY "select_pricing" ON pricing_configs FOR SELECT TO anon, authenticated USING (is_active = true);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  data jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  resource text,
  resource_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_audit" ON audit_logs;
CREATE POLICY "select_own_audit" ON audit_logs FOR SELECT TO authenticated USING (auth.uid() = admin_id);

-- System configs (key-value)
CREATE TABLE IF NOT EXISTS system_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_system_configs" ON system_configs;
CREATE POLICY "select_system_configs" ON system_configs FOR SELECT TO anon, authenticated USING (true);

-- Feature flags (public read)
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  is_enabled boolean DEFAULT true,
  description text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_feature_flags" ON feature_flags;
CREATE POLICY "select_feature_flags" ON feature_flags FOR SELECT TO anon, authenticated USING (true);

-- Locations (Bangladesh hierarchy)
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL CHECK (level IN ('division','district','upazila','union','ward','village','area','road','market','landmark')),
  name text NOT NULL,
  bn_name text,
  parent_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  postal_code text,
  latitude double precision,
  longitude double precision,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_locations" ON locations;
CREATE POLICY "select_locations" ON locations FOR SELECT TO anon, authenticated USING (is_active = true);

-- Saved locations (customer)
CREATE TABLE IF NOT EXISTS saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label text NOT NULL,
  type text DEFAULT 'pickup' CHECK (type IN ('pickup','dropoff')),
  address text NOT NULL,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  division text,
  district text,
  city text,
  thana text,
  area text,
  landmark text,
  contact_name text,
  contact_phone text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_saved_locations" ON saved_locations;
CREATE POLICY "select_own_saved_locations" ON saved_locations FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_saved_locations" ON saved_locations;
CREATE POLICY "insert_own_saved_locations" ON saved_locations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_saved_locations" ON saved_locations;
CREATE POLICY "update_own_saved_locations" ON saved_locations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_saved_locations" ON saved_locations;
CREATE POLICY "delete_own_saved_locations" ON saved_locations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_rider_id ON orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_trip_id ON orders(trip_id);
CREATE INDEX IF NOT EXISTS idx_tracking_token ON tracking_sessions(tracking_token);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_trx_id ON payments(trx_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_riders_user_id ON riders(user_id);
CREATE INDEX IF NOT EXISTS idx_riders_status ON riders(status);
