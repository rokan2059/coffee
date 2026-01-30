
export type Category = 'Hot Coffee' | 'Ice Coffee' | 'Tea' | 'Specialty' | 'Bakery';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type PaymentMethod = 'cash' | 'online';
export type PaymentStatus = 'paid' | 'unpaid';

export interface Order {
  id: string;
  date: string;
  createdAt: number; // Unix timestamp for real-time tracking
  items: CartItem[];
  total: number;
  status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  source?: 'local' | 'cloud'; // Track where the order originated
}

export interface CloudConfig {
  enabled: boolean;
  apiKey: string;
  projectUrl: string;
  lastSync?: number;
}

export type View = 'home' | 'menu' | 'admin' | 'history' | 'cart';
export type AdminSubView = 'items' | 'orders' | 'cloud' | 'settings';

export const CATEGORIES: Category[] = ['Hot Coffee', 'Ice Coffee', 'Tea', 'Specialty', 'Bakery'];
