import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { AppointmentService } from './appointment.service';
import { createMockFirestore } from '../../../test-helpers/firebase-mocks';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let mockFirestore: any;

  beforeEach(() => {
    mockFirestore = createMockFirestore();

    TestBed.configureTestingModule({
      providers: [
        AppointmentService,
        { provide: Firestore, useValue: mockFirestore },
      ],
    });

    service = TestBed.inject(AppointmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should use "appointments" collection', () => {
    expect((service as any).collection.path).toBe('appointments');
  });
});
