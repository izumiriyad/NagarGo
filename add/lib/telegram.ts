import { supabase } from '@/lib/supabase';

export interface TelegramOrderData {
  order_id: string;
  service_type: string;
  customer_name: string;
  pickup_address?: string;
  dropoff_address?: string;
  pickup_area?: string;
  dropoff_area?: string;
  total_fare: number;
  payment_method: string;
  distance_km?: number;
  pickup_contact_phone?: string;
  dropoff_contact_phone?: string;
  package_description?: string;
  special_instructions?: string;
  prescription_url?: string;
}

export interface TelegramRiderData {
  rider_id: string;
  rider_name: string;
  rider_phone: string;
  vehicle_type: string;
  vehicle_registration: string;
  nid_number?: string;
  preferred_zone?: string;
}

export interface TelegramSupportData {
  ticket_id: string;
  subject: string;
  category: string;
  description: string;
}

export interface TelegramPaymentData {
  payment_id: string;
  order_id: string;
  amount: number;
  trx_id: string;
  sender_bkash_number: string;
}

export interface TelegramPayoutData {
  payout_id: string;
  rider_name: string;
  amount: number;
  bkash_number: string;
}

export interface TelegramReviewData {
  reviewer_name: string;
  rating: number;
  service: string;
  comment: string;
}

export interface TelegramLoginData {
  customer_name: string;
  user_email: string;
  user_phone?: string;
}

export interface TelegramRegistrationData {
  customer_name: string;
  user_email: string;
  user_phone?: string;
}

export interface TelegramLocationData {
  customer_name: string;
  location_name: string;
  location_address: string;
  location_lat?: number;
  location_lng?: number;
}

export interface TelegramRiderFeeData {
  rider_name: string;
  rider_phone: string;
  fee_type: 'registration' | 'maintenance';
  trx_id: string;
}

async function invokeTelegram(body: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('telegram-notify', { body });
    if (error) console.error('Telegram notification failed:', error.message);
  } catch (err) {
    console.error('Telegram notification error:', err);
  }
}

export async function notifyTelegramOrder(order: TelegramOrderData): Promise<void> {
  await invokeTelegram({ type: 'order', ...order });
}

export async function notifyTelegramRiderApplication(data: TelegramRiderData): Promise<void> {
  await invokeTelegram({ type: 'rider_application', ...data });
}

export async function notifyTelegramSupportTicket(data: TelegramSupportData): Promise<void> {
  await invokeTelegram({ type: 'support_ticket', ...data });
}

export async function notifyTelegramPayment(data: TelegramPaymentData): Promise<void> {
  await invokeTelegram({ type: 'payment', ...data });
}

export async function notifyTelegramPayout(data: TelegramPayoutData): Promise<void> {
  await invokeTelegram({ type: 'payout', ...data });
}

export async function notifyTelegramReview(data: TelegramReviewData): Promise<void> {
  await invokeTelegram({ type: 'review', ...data });
}

export async function notifyTelegramLogin(data: TelegramLoginData): Promise<void> {
  await invokeTelegram({ type: 'login', ...data });
}

export async function notifyTelegramRegistration(data: TelegramRegistrationData): Promise<void> {
  await invokeTelegram({ type: 'registration', ...data });
}

export async function notifyTelegramLocation(data: TelegramLocationData): Promise<void> {
  await invokeTelegram({ type: 'location', ...data });
}

export async function notifyTelegramRiderFee(data: TelegramRiderFeeData): Promise<void> {
  await invokeTelegram({ type: 'rider_fee', ...data });
}
