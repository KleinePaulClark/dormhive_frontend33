import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_RECENTLY_VIEWED_LISTINGS,
  distanceInKilometers,
  getRecentlyViewedListingIds,
  NEARBY_PRIORITY_RADIUS_KM,
  prioritizeListings,
  recordRecentlyViewedListing
} from './listingDiscovery.js';

test('recommended listings put nearby homes first, then recent views, then newest', () => {
  const origin = { latitude: 14.6, longitude: 121 };
  const listings = [
    { id: 1, latitude: 14.8, longitude: 121, created_at: '2026-06-01' },
    { id: 2, latitude: 14.61, longitude: 121, created_at: '2026-01-01' },
    { id: 3, latitude: 14.6001, longitude: 121, created_at: '2025-01-01' },
    { id: 4, latitude: 14.7, longitude: 121, created_at: '2024-01-01' },
    { id: 5, latitude: null, longitude: null, created_at: '2025-06-01' },
    { id: 6, latitude: 14.64, longitude: 121, created_at: '2024-06-01' },
    { id: 7, latitude: 14.65, longitude: 121, created_at: '2024-07-01' }
  ];

  assert.ok(distanceInKilometers(origin, listings.find(({ id }) => id === 6)) < NEARBY_PRIORITY_RADIUS_KM);
  assert.ok(distanceInKilometers(origin, listings.find(({ id }) => id === 7)) > NEARBY_PRIORITY_RADIUS_KM);
  assert.deepEqual(
    prioritizeListings(listings, { userLocation: origin, recentlyViewedIds: ['7', '4', '5'] }).map(({ id }) => id),
    [3, 2, 6, 7, 4, 5, 1]
  );
});

test('recent views precede newest listings when no location is available', () => {
  const listings = [
    { id: 1, created_at: '2026-06-01' },
    { id: 2, created_at: '2025-06-01' },
    { id: 3, created_at: '2024-06-01' }
  ];

  assert.deepEqual(prioritizeListings(listings, { recentlyViewedIds: ['3', '2'] }).map(({ id }) => id), [3, 2, 1]);
});

test('recent views move to the front, are unique, capped, and isolated per user', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  for (let id = 1; id <= MAX_RECENTLY_VIEWED_LISTINGS + 1; id += 1) {
    recordRecentlyViewedListing(7, id, storage);
  }
  recordRecentlyViewedListing(7, 3, storage);

  assert.deepEqual(getRecentlyViewedListingIds(7, storage), ['3', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '2']);
  assert.deepEqual(getRecentlyViewedListingIds(8, storage), []);
});
