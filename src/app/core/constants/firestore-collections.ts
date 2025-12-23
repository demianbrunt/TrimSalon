export const FIRESTORE_COLLECTION = {
  appointments: 'appointments',
  breeds: 'breeds',
  clients: 'clients',
  expenses: 'expenses',
  invoices: 'invoices',
  packages: 'packages',
  settings: 'settings',
  services: 'services',
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTION)[keyof typeof FIRESTORE_COLLECTION];
