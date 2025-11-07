import { Observable, of } from 'rxjs';

/**
 * Mock Firestore implementation for testing
 */
export class MockFirestore {
  collection(path: string) {
    return {
      path,
      withConverter: () => this.collection(path),
    };
  }

  doc(path: string) {
    return {
      path,
      withConverter: () => this.doc(path),
    };
  }
}

/**
 * Mock Auth implementation for testing
 */
export class MockAuth {
  currentUser: any = null;
  authState$ = of(null);

  signInWithPopup = jasmine.createSpy('signInWithPopup').and.returnValue(Promise.resolve({
    user: { uid: 'test-uid', email: 'test@example.com', displayName: 'Test User' }
  }));

  signOut = jasmine.createSpy('signOut').and.returnValue(Promise.resolve());
}

/**
 * Mock Functions implementation for testing
 */
export class MockFunctions {
  httpsCallable = jasmine.createSpy('httpsCallable').and.returnValue(() => of({ data: {} }));
}

/**
 * Helper to create a mock collection data observable
 */
export function mockCollectionData<T>(data: T[]): Observable<T[]> {
  return of(data);
}

/**
 * Helper to create a mock document data observable
 */
export function mockDocData<T>(data: T): Observable<T> {
  return of(data);
}

/**
 * Mock Timestamp for Firestore
 */
export class MockTimestamp {
  constructor(public seconds: number, public nanoseconds: number) {}

  toDate(): Date {
    return new Date(this.seconds * 1000);
  }

  static now(): MockTimestamp {
    const now = Date.now();
    return new MockTimestamp(Math.floor(now / 1000), (now % 1000) * 1000000);
  }

  static fromDate(date: Date): MockTimestamp {
    const ms = date.getTime();
    return new MockTimestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
  }
}
