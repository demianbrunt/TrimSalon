import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { createMockFirestore } from '../../../test-helpers/firebase-mocks';
import { BaseService } from './base.service';

// Test implementation of BaseService
class TestService extends BaseService<{ id?: string; name: string }> {
  constructor() {
    super('test-collection');
  }
}

describe('BaseService', () => {
  beforeEach(() => {
    const mockFirestore = createMockFirestore();

    TestBed.configureTestingModule({
      providers: [TestService, { provide: Firestore, useValue: mockFirestore }],
    });
  });

  it('should be defined', () => {
    expect(BaseService).toBeDefined();
    expect(TestService).toBeDefined();
  });

  // Note: Testing Firebase services properly requires either:
  // 1. Firebase Emulator for integration tests
  // 2. Mocking the service itself (not Firebase SDK)
  // 3. Testing business logic separately from Firebase calls
  //
  // BaseService provides CRUD operations that are tested indirectly
  // through the services that extend it
});
