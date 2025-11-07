import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { InvoiceService } from './invoice.service';
import { createMockFirestore } from '../../../test-helpers/firebase-mocks';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let mockFirestore: any;

  beforeEach(() => {
    mockFirestore = createMockFirestore();

    TestBed.configureTestingModule({
      providers: [
        InvoiceService,
        { provide: Firestore, useValue: mockFirestore },
      ],
    });

    service = TestBed.inject(InvoiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should use "invoices" collection', () => {
    expect((service as any).collection.path).toBe('invoices');
  });
});
