import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { PackageService } from './package.service';
import { MockFirestore } from '../../../test-helpers/firebase-mocks';

describe('PackageService', () => {
  let service: PackageService;
  let mockFirestore: MockFirestore;

  beforeEach(() => {
    mockFirestore = new MockFirestore();

    TestBed.configureTestingModule({
      providers: [
        PackageService,
        { provide: Firestore, useValue: mockFirestore },
      ],
    });

    service = TestBed.inject(PackageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should use "packages" collection', () => {
    expect((service as any).collection.path).toBe('packages');
  });
});
