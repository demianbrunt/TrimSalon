export const FIRESTORE_COLLECTION = {
  appointments: 'appointments',
  breeds: 'breeds',
  bookingRequests: 'booking-requests',
  clients: 'clients',
  expenses: 'expenses',
  invoices: 'invoices',
  packages: 'packages',
  settings: 'settings',
  services: 'services',
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTION)[keyof typeof FIRESTORE_COLLECTION];
