/**
 * lib/auth.ts
 *
 * Demo-mode authentication utilities. In production, this would be replaced
 * by actual IBM App ID integration.
 */

import { User } from '@/types';

const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'demo@example.com',
  name: 'Demo User',
};

const DEMO_TOKEN = 'demo-token-12345';

/**
 * Simulates a login request. In demo mode, always succeeds.
 */
export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  // In demo mode, accept any credentials
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return { user: DEMO_USER, token: DEMO_TOKEN };
}

/**
 * Validates a demo token. Always returns valid for demo tokens.
 */
export async function validateToken(token: string): Promise<{ valid: boolean; user?: User }> {
  if (token === DEMO_TOKEN) {
    return { valid: true, user: DEMO_USER };
  }
  return { valid: false };
}

/**
 * Logs out the user by clearing localStorage.
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}

/**
 * Gets the stored demo user from localStorage.
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('auth_user');
  return stored ? JSON.parse(stored) : null;
}

/**
 * Gets the stored demo token from localStorage.
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Stores user and token in localStorage.
 */
export function storeAuth(user: User, token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('auth_token', token);
  }
}