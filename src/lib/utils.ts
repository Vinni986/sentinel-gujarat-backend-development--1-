import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Normalize Indian vehicle registration number
// Examples: GJ01AB1234, GJ 01 AB 1234, gj-01-ab-1234
export function normalizeRegistrationNumber(plateNumber: string): string {
  // Remove all spaces, hyphens, and convert to uppercase
  const cleaned = plateNumber.replace(/[\s\-]/g, '').toUpperCase();
  
  // Basic validation for Indian format: 2-4 letters, 2 digits, 1-3 letters, 4 digits
  // e.g., GJ01AB1234 or MH12DE3456
  const match = cleaned.match(/^([A-Z]{2,4})(\d{2})([A-Z]{1,3})(\d{4})$/);
  
  if (match) {
    const [, state, district, series, number] = match;
    return `${state}${district}${series}${number}`;
  }
  
  // Return cleaned version even if it doesn't match standard format
  return cleaned;
}

// Format registration number for display
export function formatRegistrationNumber(plateNumber: string): string {
  const normalized = normalizeRegistrationNumber(plateNumber);
  const match = normalized.match(/^([A-Z]{2,4})(\d{2})([A-Z]{1,3})(\d{4})$/);
  
  if (match) {
    const [, state, district, series, number] = match;
    return `${state} ${district} ${series} ${number}`;
  }
  
  return normalized;
}

// Format date and time
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDateTime(d);
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Generate camera ID
export function generateCameraId(index: number): string {
  return `CAM-${index.toString().padStart(3, '0')}`;
}

// Get severity color
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'text-blue-600 bg-blue-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50',
  };
  return colors[severity] || colors.medium;
}

// Get status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    online: 'text-green-600 bg-green-50',
    offline: 'text-gray-600 bg-gray-50',
    maintenance: 'text-yellow-600 bg-yellow-50',
    error: 'text-red-600 bg-red-50',
  };
  return colors[status] || colors.offline;
}
