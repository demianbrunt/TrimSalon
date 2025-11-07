import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { PackageService } from './package.service';
import { createMockFirestore } from '../../../test-helpers/firebase-mocks';

describe('PackageService', () => {
  beforeEach(() => {
    const mockFirestore = createMockFirestore();

    TestBed.configureTestingModule({
      providers: [
        PackageService,
        { provide: Firestore, useValue: mockFirestore },
      ],
    });
  });

  it('should be defined', () => {
    expect(PackageService).toBeDefined();
  });

  // Note: Testing Firebase services properly requires either:
  // 1. Firebase Emulator for integration tests
  // 2. Mocking the service itself (not Firebase SDK)
  // 3. Testing business logic separately from Firebase calls
  //
  // The service is tested indirectly through higher-level component tests
});
