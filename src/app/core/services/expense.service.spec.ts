import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { ExpenseService } from './expense.service';
import { MockFirestore } from '../../../test-helpers/firebase-mocks';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let mockFirestore: MockFirestore;

  beforeEach(() => {
    mockFirestore = new MockFirestore();

    TestBed.configureTestingModule({
      providers: [
        ExpenseService,
        { provide: Firestore, useValue: mockFirestore },
      ],
    });

    service = TestBed.inject(ExpenseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should use "expenses" collection', () => {
    expect((service as any).collection.path).toBe('expenses');
  });
});
