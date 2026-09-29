/*
# Add rider fee columns

## Changes
1. Add registration_fee_paid (boolean, default false) to riders
2. Add registration_fee_trx_id (text) to riders
3. Add registration_fee_screenshot_url (text) to riders
4. Add maintenance_fee_paid_until (date) to riders — tracks monthly maintenance fee
5. Add maintenance_fee_trx_id (text) to riders
*/

ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS registration_fee_paid boolean DEFAULT false;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS registration_fee_trx_id text;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS registration_fee_screenshot_url text;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS maintenance_fee_paid_until date;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS maintenance_fee_trx_id text;
