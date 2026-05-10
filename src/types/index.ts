export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  household_id: string;
  language: 'en' | 'he';
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  household_id: string;
  name: string;
  quantity: number;
  unit: string;
  estimated_price?: number;
  category?: string;
  created_by: string;
  created_at: string;
  completed_at?: string;
  archived_at?: string;
}

export interface Receipt {
  id: string;
  household_id: string;
  image_url: string;
  total_amount: number;
  items: ReceiptItem[];
  date: string;
  uploaded_by: string;
  created_at: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface PriceHistory {
  item_name: string;
  price: number;
  date: string;
  household_id: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export type WaterStatus = 'overdue' | 'due-soon' | 'watered';
