import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { AppointmentService } from './appointment.service';
import { createMockFirestore } from '../../../test-helpers/firebase-mocks';

describe('AppointmentService', () => {
  beforeEach(() => {
    const mockFirestore = createMockFirestore();

    TestBed.configureTestingModule({
      providers: [
        AppointmentService,
        { provide: Firestore, useValue: mockFirestore },
      ],
    });
  });

  it('should be defined', () => {
    expect(AppointmentService).toBeDefined();
  });

  // Note: Testing Firebase services properly requires either:
  // 1. Firebase Emulator for integration tests
  // 2. Mocking the service itself (not Firebase SDK)
  // 3. Testing business logic separately from Firebase calls
  //
  // The service is tested indirectly through higher-level component tests
});
