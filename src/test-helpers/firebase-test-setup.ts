/**
 * Firebase Test Setup
 *
 * This file provides utilities to mock Firebase SDK functions for testing.
 * Instead of mocking the Firestore instance, we mock the SDK functions themselves.
 */

import { of } from 'rxjs';

/**
 * Setup spies for Firebase Firestore functions
 * Call this in your test's beforeEach()
 */
export function setupFirestoreMocks() {
  // We can't easily mock these at runtime because they're imported as named exports
  // Instead, each test should provide mock Firestore via DI
  return {
    mockCollectionData: jasmine
      .createSpy('collectionData')
      .and.returnValue(of([])),
    mockDocData: jasmine.createSpy('docData').and.returnValue(of({})),
    mockAddDoc: jasmine
      .createSpy('addDoc')
      .and.returnValue(Promise.resolve({ id: 'mock-id' })),
    mockUpdateDoc: jasmine
      .createSpy('updateDoc')
      .and.returnValue(Promise.resolve()),
    mockDeleteDoc: jasmine
      .createSpy('deleteDoc')
      .and.returnValue(Promise.resolve()),
    mockGetDoc: jasmine
      .createSpy('getDoc')
      .and.returnValue(
        Promise.resolve({ exists: () => true, data: () => ({}) }),
      ),
  };
}

/**
 * Alternative: Create a test environment config
 *
 * Since Firebase SDK functions are hard to mock,
 * the best approach is to:
 * 1. Use real Firebase with emulator for integration tests
 * 2. Use mock services for unit tests (mock the service, not Firebase)
 * 3. Keep tests simple - test business logic, not Firebase calls
 */
export function createTestEnvironment() {
  return {
    useFirebaseEmulator: false, // Set to true for integration tests
    emulatorHost: 'localhost:8080',
  };
}
