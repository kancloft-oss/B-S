// --- Types ---
export interface Product {
  id: string;
  name: string;
  price: number;
  purchasePrice?: number;
  stock: number;
  image: string;
  category?: string;
  salesCount?: number;
  lastOrdered?: string;
  sku?: string;
  code?: string;
  unit?: string;
  fullName?: string;
  description?: string;
}

export interface OrderItem {
  productId: string;
  qty: number;
  price: number;
  product?: Product;
}

export interface Order {
  id: string;
  date: string;
  customer: string;
  phone: string;
  status: string;
  total: number;
  items: OrderItem[];
  userId?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  status: 'active' | 'inactive' | 'new';
  totalSpent: number;
  orderCount: number;
  lastPurchaseDate: string;
  segment: 'hot' | 'warm' | 'medium' | 'cold' | 'dormant';
  rating: number;
  isBlocked?: boolean;
  avatar?: string;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  action: string;
  active: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'manager' | 'editor' | 'support';
  lastActive: string;
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}