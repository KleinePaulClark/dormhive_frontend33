export const MAX_RECENTLY_VIEWED_LISTINGS = 12;
export const NEARBY_PRIORITY_RADIUS_KM = 5;

const RECENTLY_VIEWED_KEY = 'dormhive.recentlyViewedListings';

function recentKey(userId) {
  return `${RECENTLY_VIEWED_KEY}:${encodeURIComponent(String(userId))}`;
}

export function getRecentlyViewedListingIds(userId, storage = globalThis.localStorage) {
  if (userId === null || userId === undefined || !storage?.getItem) return [];
  try {
    const values = JSON.parse(storage.getItem(recentKey(userId)) || '[]');
    return Array.isArray(values)
      ? [...new Set(values.map((value) => String(value)).filter(Boolean))].slice(0, MAX_RECENTLY_VIEWED_LISTINGS)
      : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewedListing(userId, listingId, storage = globalThis.localStorage) {
  const id = String(listingId ?? '').trim();
  if (userId === null || userId === undefined || !id || !storage?.setItem) {
    return getRecentlyViewedListingIds(userId, storage);
  }
  const key = recentKey(userId);
  const next = [id, ...getRecentlyViewedListingIds(userId, storage).filter((value) => value !== id)]
    .slice(0, MAX_RECENTLY_VIEWED_LISTINGS);
  try {
    storage.setItem(key, JSON.stringify(next));
  } catch {
    return getRecentlyViewedListingIds(userId, storage);
  }
  return next;
}

function coordinate(value, min, max) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

export function distanceInKilometers(userLocation, property) {
  const latitude = coordinate(userLocation?.latitude, -90, 90);
  const longitude = coordinate(userLocation?.longitude, -180, 180);
  const propertyLatitude = coordinate(property?.latitude ?? property?.lat, -90, 90);
  const propertyLongitude = coordinate(property?.longitude ?? property?.lng, -180, 180);
  if ([latitude, longitude, propertyLatitude, propertyLongitude].some((value) => value === null)) return Infinity;

  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(propertyLatitude - latitude);
  const longitudeDelta = radians(propertyLongitude - longitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(latitude)) * Math.cos(radians(propertyLatitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

function createdAt(property) {
  const value = Date.parse(property?.created_at ?? '');
  return Number.isFinite(value) ? value : 0;
}

export function prioritizeListings(listings, { userLocation = null, recentlyViewedIds = [] } = {}) {
  const recentOrder = new Map(recentlyViewedIds.map((id, index) => [String(id), index]));
  return listings
    .map((property, index) => {
      const distance = distanceInKilometers(userLocation, property);
      const isNearby = distance <= NEARBY_PRIORITY_RADIUS_KM;
      const recentIndex = recentOrder.get(String(property.id));
      return {
        property,
        index,
        distance,
        priority: isNearby ? 0 : recentIndex !== undefined ? 1 : 2,
        recentIndex
      };
    })
    .sort((left, right) => {
      if (left.priority !== right.priority) return left.priority - right.priority;
      if (left.priority === 0 && left.distance !== right.distance) return left.distance - right.distance;
      if (left.priority === 1 && left.recentIndex !== right.recentIndex) return left.recentIndex - right.recentIndex;
      return createdAt(right.property) - createdAt(left.property) || left.index - right.index;
    })
    .map(({ property }) => property);
}
