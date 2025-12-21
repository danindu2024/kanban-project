export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: Date;
}