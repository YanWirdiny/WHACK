/**
 * Priority levels for items
 */
export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Interface for items with location and priority
 */
export interface PriorityItem {
  id: string;
  name: string;
  priority: Priority;
  location: {
    latitude: number;
    longitude: number;
  };
  distance?: number; // Distance from user in meters
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Sort items by priority (high to low) and distance (close to far)
 */
export function sortItemsByPriorityAndDistance(items: PriorityItem[]): PriorityItem[] {
  const priorityOrder = { [Priority.HIGH]: 1, [Priority.MEDIUM]: 2, [Priority.LOW]: 3 };
  
  return [...items].sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then sort by distance if priorities are equal
    const distanceA = a.distance ?? Infinity;
    const distanceB = b.distance ?? Infinity;
    return distanceA - distanceB;
  });
}

/**
 * Find the closest item with highest priority
 */
export function getClosestHighPriorityItem(items: PriorityItem[]): PriorityItem | null {
  const sorted = sortItemsByPriorityAndDistance(items);
  return sorted.length > 0 ? sorted[0] : null;
}
