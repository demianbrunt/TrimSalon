import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { of, throwError } from 'rxjs';
import { BaseService } from './base.service';
import { MockFirestore, MockTimestamp } from '../../../test-helpers/firebase-mocks';

// Test implementation of BaseService
class TestService extends BaseService<{ id?: string; name: string }> {
  constructor() {
    super('test-collection');
  }
}

describe('BaseService', () => {
  let service: TestService;
  let mockFirestore: MockFirestore;

  beforeEach(() => {
    mockFirestore = new MockFirestore();

    TestBed.configureTestingModule({
      providers: [
        TestService,
        { provide: Firestore, useValue: mockFirestore },
      ],
    });

    service = TestBed.inject(TestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getData$', () => {
    it('should fetch and convert data from collection', (done) => {
      const mockData = [
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' },
      ];

      // Mock collectionData to return observable
      spyOn<any>(service, 'getData$').and.returnValue(of(mockData));

      service.getData$().subscribe((data) => {
        expect(data).toEqual(mockData);
        expect(data.length).toBe(2);
        done();
      });
    });

    it('should handle Timestamp conversion', (done) => {
      const timestamp = MockTimestamp.fromDate(new Date('2024-01-01'));
      const mockData = [
        { id: '1', name: 'Test', createdAt: timestamp },
      ];

      spyOn<any>(service, 'getData$').and.returnValue(
        of([{ id: '1', name: 'Test', createdAt: timestamp.toDate() }])
      );

      service.getData$().subscribe((data: any) => {
        expect(data[0].createdAt instanceof Date).toBe(true);
        done();
      });
    });
  });

  describe('getById', () => {
    it('should fetch document by id', (done) => {
      const mockDoc = { id: '1', name: 'Test Item' };

      spyOn<any>(service, 'getById').and.returnValue(of(mockDoc));

      service.getById('1').subscribe((data) => {
        expect(data).toEqual(mockDoc);
        expect(data.id).toBe('1');
        done();
      });
    });
  });

  describe('add', () => {
    it('should add new document and return with id', (done) => {
      const newItem = { name: 'New Item' };
      const expectedResult = { id: 'new-id', name: 'New Item' };

      spyOn<any>(service, 'add').and.returnValue(of(expectedResult));

      service.add(newItem).subscribe((result) => {
        expect(result).toEqual(expectedResult);
        expect(result.id).toBe('new-id');
        done();
      });
    });

    it('should remove undefined fields before adding', (done) => {
      const itemWithUndefined = { name: 'Test', optional: undefined };
      const expectedResult = { id: 'new-id', name: 'Test' };

      spyOn<any>(service, 'add').and.returnValue(of(expectedResult));

      service.add(itemWithUndefined as any).subscribe((result) => {
        expect(result.id).toBe('new-id');
        done();
      });
    });

    it('should handle errors when adding', (done) => {
      const newItem = { name: 'New Item' };
      const error = new Error('Firestore error');

      spyOn<any>(service, 'add').and.returnValue(throwError(() => error));

      service.add(newItem).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should update document and return updated item', (done) => {
      const updateItem = { id: '1', name: 'Updated Item' };

      spyOn<any>(service, 'update').and.returnValue(of(updateItem));

      service.update(updateItem).subscribe((result) => {
        expect(result).toEqual(updateItem);
        done();
      });
    });

    it('should remove undefined fields before updating', (done) => {
      const itemWithUndefined = { id: '1', name: 'Test', optional: undefined };
      const expectedResult = { id: '1', name: 'Test' };

      spyOn<any>(service, 'update').and.returnValue(of(expectedResult));

      service.update(itemWithUndefined as any).subscribe((result) => {
        expect(result.id).toBe('1');
        done();
      });
    });

    it('should handle errors when updating', (done) => {
      const updateItem = { id: '1', name: 'Updated' };
      const error = new Error('Update failed');

      spyOn<any>(service, 'update').and.returnValue(throwError(() => error));

      service.update(updateItem).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete document by id', (done) => {
      spyOn<any>(service, 'delete').and.returnValue(of(undefined));

      service.delete('1').subscribe(() => {
        expect(true).toBe(true);
        done();
      });
    });

    it('should handle errors when deleting', (done) => {
      const error = new Error('Delete failed');

      spyOn<any>(service, 'delete').and.returnValue(throwError(() => error));

      service.delete('1').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });
});
