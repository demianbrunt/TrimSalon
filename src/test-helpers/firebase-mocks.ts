import { Observable, of } from 'rxjs';

/**
 * Create a proper Firestore mock factory for TestBed
 *
 * This creates a mock that passes Firebase's type checks by including
 * all the properties Firebase expects on a Firestore instance.
 */
export function createMockFirestore() {
  const mockFirestore: Record<string, unknown> = {
    // Required Firestore properties that Firebase checks for
    type: 'firestore',
    _databaseId: {
      projectId: 'test-project',
      database: '(default)',
    },
    _settings: {},
    _persistenceKey: '[DEFAULT]',

    // Mock app property
    app: {
      name: '[DEFAULT]',
      options: {
        projectId: 'test-project',
      },
      automaticDataCollectionEnabled: false,
    },

    // These are checked by Firebase internally
    _delegate: {
      type: 'firestore',
      _databaseId: {
        projectId: 'test-project',
        database: '(default)',
      },
    },
  };

  return mockFirestore;
}

/**
 * Mock Firestore implementation for testing (legacy - use createMockFirestore instead)
 */
export class MockFirestore {
  type = 'firestore';
  _databaseId = {
    projectId: 'test-project',
    database: '(default)',
  };
  _settings = {};
  _persistenceKey = '[DEFAULT]';

  app = {
    name: '[DEFAULT]',
    options: {
      projectId: 'test-project',
    },
    automaticDataCollectionEnabled: false,
  };

  _delegate: Record<string, unknown> = {
    type: 'firestore',
    _databaseId: {
      projectId: 'test-project',
      database: '(default)',
    },
  };

  collection(path: string) {
    return {
      path,
      id: path,
      parent: null,
      withConverter: () => this.collection(path),
    };
  }

  doc(path: string) {
    return {
      path,
      id: path.split('/').pop(),
      parent: null,
      withConverter: () => this.doc(path),
    };
  }
}

/**
 * Mock Auth implementation for testing
 */
export class MockAuth {
  currentUser: unknown = null;
  authState$ = of(null);

  signInWithPopup = jasmine.createSpy('signInWithPopup').and.returnValue(
    Promise.resolve({
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      },
    }),
  );

  signOut = jasmine.createSpy('signOut').and.returnValue(Promise.resolve());

  setPersistence = jasmine
    .createSpy('setPersistence')
    .and.returnValue(Promise.resolve());

  // Add other common Auth properties
  app = {
    name: '[DEFAULT]',
    options: {},
  };

  config = {
    apiKey: 'test-api-key',
    authDomain: 'test.firebaseapp.com',
  };

  name = '[DEFAULT]';
}

/**
 * Mock Functions implementation for testing
 *
 * Properly mocks Firebase Functions with required properties
 */
export class MockFunctions {
  // Mock the internal _url function that Firebase uses
  _url = jasmine
    .createSpy('_url')
    .and.returnValue('https://mock-function-url.com');

  // Mock the region property
  region = 'us-central1';

  // Mock the customDomain property
  customDomain = null;

  // Mock app property
  app = {
    name: '[DEFAULT]',
    options: {},
  };

  httpsCallable = jasmine
    .createSpy('httpsCallable')
    .and.returnValue(() => of({ data: {} }));
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
  constructor(
    public seconds: number,
    public nanoseconds: number,
  ) {}

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
