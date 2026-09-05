import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Simple session-based auth for MVP
// In production, use NextAuth.js or similar

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: string;
}

// Hash password (simple for MVP - use bcrypt in production)
export async function hashPassword(password: string): Promise<string> {
  // For MVP, we'll use a simple hash
  // In production, use bcrypt or argon2
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Get user by email
export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

// Get user by ID
export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

// Create demo user for development
export async function createDemoUser() {
  const existingUser = await getUserByEmail('admin@sentinel.gov.in');
  if (existingUser) {
    return existingUser;
  }

  const passwordHash = await hashPassword('admin123');
  const [newUser] = await db.insert(users).values({
    email: 'admin@sentinel.gov.in',
    passwordHash,
    name: 'System Administrator',
    role: 'admin',
    isActive: true,
  }).returning();

  return newUser;
}
