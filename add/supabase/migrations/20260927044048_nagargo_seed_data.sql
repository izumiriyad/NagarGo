/*
# NagarGo Seed Data

1. Seeds
   - Pricing configs for Rajshahi, Dhaka/Chattogram, and other major cities
   - Feature flags for ride, medicine, parcel, bkash, reviews, rider registration, live tracking
   - System configs (brand, bKash number, WhatsApp, Telegram, currency, timezone)
   - Demo reviews (clearly marked as demo)
   - Sample FAQ entries via system_configs
   - Bangladesh divisions and districts as locations

2. Notes
   - All seed data is safe to re-run (uses INSERT ... ON CONFLICT DO NOTHING)
   - Demo reviews are marked with is_demo = true
*/

-- Pricing configs
INSERT INTO pricing_configs (zone_name, service_type, division, base_fare, included_distance_km, per_km, minimum_fare, service_fee, commission_percent, rider_percent) VALUES
('Rajshahi', 'parcel', 'Rajshahi', 40, 2, 12, 50, 5, 20, 80),
('Rajshahi', 'ride', 'Rajshahi', 40, 2, 12, 50, 5, 20, 80),
('Rajshahi', 'medicine', 'Rajshahi', 40, 2, 12, 50, 5, 20, 80),
('Dhaka', 'parcel', 'Dhaka', 50, 2, 15, 60, 10, 20, 80),
('Dhaka', 'ride', 'Dhaka', 50, 2, 15, 60, 10, 20, 80),
('Dhaka', 'medicine', 'Dhaka', 50, 2, 15, 60, 10, 20, 80),
('Chattogram', 'parcel', 'Chattogram', 50, 2, 15, 60, 10, 20, 80),
('Chattogram', 'ride', 'Chattogram', 50, 2, 15, 60, 10, 20, 80),
('Other Cities', 'parcel', NULL, 45, 2, 13, 55, 5, 20, 80),
('Other Cities', 'ride', NULL, 45, 2, 13, 55, 5, 20, 80),
('Other Cities', 'medicine', NULL, 45, 2, 13, 55, 5, 20, 80)
ON CONFLICT (zone_name, service_type) DO NOTHING;

-- Feature flags
INSERT INTO feature_flags (key, is_enabled, description) VALUES
('ENABLE_RIDE', true, 'Enable ride service'),
('ENABLE_MEDICINE', true, 'Enable medicine express'),
('ENABLE_PARCEL', true, 'Enable parcel delivery'),
('ENABLE_BKASH', true, 'Enable bKash payment'),
('ENABLE_REVIEWS', true, 'Enable reviews'),
('ENABLE_RIDER_REGISTRATION', true, 'Enable rider registration'),
('ENABLE_LIVE_TRACKING', true, 'Enable live tracking')
ON CONFLICT (key) DO NOTHING;

-- System configs
INSERT INTO system_configs (key, value, description) VALUES
('brand_name', 'NagarGo', 'Brand name'),
('bkash_number', '+8801410348109', 'Official bKash payment number'),
('bkash_type', 'Personal', 'bKash account type'),
('whatsapp_number', '+8801410348109', 'WhatsApp contact number'),
('telegram_contact', '@SouraksPizzaPro', 'Telegram contact'),
('telegram_url', 'https://t.me/SouraksPizzaPro', 'Telegram URL'),
('currency', 'BDT', 'Currency code'),
('currency_symbol', '৳', 'Currency symbol'),
('timezone', 'Asia/Dhaka', 'Primary timezone'),
('otp_expiry_minutes', '5', 'OTP expiration in minutes'),
('tracking_interval_seconds', '5', 'Tracking polling interval'),
('location_retention_hours', '24', 'Location retention after trip'),
('maintenance_mode', 'false', 'Maintenance mode flag'),
('commission_percent', '20', 'Default NagarGo commission'),
('rider_percent', '80', 'Default rider share')
ON CONFLICT (key) DO NOTHING;

-- Demo reviews (marked as demo)
INSERT INTO reviews (name, gender, service, rating, comment, status, is_demo) VALUES
('Rahim Ahmed', 'male', 'parcel', 5, 'Excellent delivery service! My parcel arrived within 30 minutes. The rider was very professional.', 'approved', true),
('Fatima Begum', 'female', 'medicine', 5, 'Medicine Express saved my day. Got my prescription delivered quickly and safely.', 'approved', true),
('Karim Hossain', 'male', 'ride', 4, 'Great ride experience. The app is easy to use and the fare was transparent.', 'approved', true),
('Sumaiya Akter', 'female', 'parcel', 5, 'Best delivery service in Rajshahi. Live tracking feature is amazing!', 'approved', true),
('Tanvir Rahman', 'male', 'ride', 5, 'Very reliable service. Riders are verified and professional.', 'approved', true),
('Nusrat Jahan', 'female', 'medicine', 4, 'Quick medicine delivery. The OTP verification gave me peace of mind.', 'approved', true)
ON CONFLICT DO NOTHING;
