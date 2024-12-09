export interface Client {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  initial_balance: number;
  company_logo_url?: string;
}

export interface User {
  id: string;
  created_at: string;
  email: string;
  password_hash: string;
}

export interface Transaction {
  id: string;
  created_at: string;
  mono_ledger_account_id: string;
  amount: number;
  operation: string;
  status: 'success' | 'failed';
  external_id: string;
} 