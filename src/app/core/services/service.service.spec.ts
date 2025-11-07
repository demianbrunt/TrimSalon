import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { ServiceService } from './service.service';
import { createMockFirestore } from '../../../test-helpers/firebase-mocks';

describe('ServiceService', () => {
  let service: ServiceService;
  let mockFirestore: any;

  beforeEach(() => {
    mockFirestore = createMockFirestore();

    TestBed.configureTestingModule({
      providers: [
        ServiceService,
        { provide: Firestore, useValue: mockFirestore },
      ],
    });

    service = TestBed.inject(ServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should use "services" collection', () => {
    expect((service as any).collection.path).toBe('services');
  });
});
