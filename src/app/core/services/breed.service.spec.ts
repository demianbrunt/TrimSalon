import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { BreedService } from './breed.service';
import { createMockFirestore } from '../../../test-helpers/firebase-mocks';
import { TestDataFactory } from '../../../test-helpers/test-data-factory';

describe('BreedService', () => {
  let service: BreedService;
  let mockFirestore: any;

  beforeEach(() => {
    mockFirestore = createMockFirestore();

    TestBed.configureTestingModule({
      providers: [
        BreedService,
        { provide: Firestore, useValue: mockFirestore },
      ],
    });
  });

  it('should be created', () => {
    // Mock getData$ to prevent initialization
    spyOn(BreedService.prototype, 'getData$').and.returnValue(of([]));
    service = TestBed.inject(BreedService);
    expect(service).toBeTruthy();
  });

  it('should use "breeds" collection', () => {
    spyOn(BreedService.prototype, 'getData$').and.returnValue(of([]));
    service = TestBed.inject(BreedService);
    expect((service as any).collection.path).toBe('breeds');
  });

  it('should initialize default breeds when collection is empty', (done) => {
    const addSpy = spyOn(BreedService.prototype, 'add').and.returnValue(
      of({ id: 'new-id', name: 'Test', size: 'small' as const }),
    );
    spyOn(BreedService.prototype, 'getData$').and.returnValue(of([]));

    service = TestBed.inject(BreedService);

    // Wait for initialization
    setTimeout(() => {
      expect(addSpy).toHaveBeenCalled();
      // Should add many default breeds
      expect(addSpy.calls.count()).toBeGreaterThan(50);
      done();
    }, 100);
  });

  it('should not add default breeds if they already exist', (done) => {
    const existingBreeds = [
      TestDataFactory.createBreed({ name: 'Labrador', size: 'large' as const }),
      TestDataFactory.createBreed({
        name: 'Chihuahua',
        size: 'small' as const,
      }),
    ];

    const addSpy = spyOn(BreedService.prototype, 'add').and.returnValue(
      of({ id: 'new-id', name: 'Test', size: 'small' as const }),
    );
    spyOn(BreedService.prototype, 'getData$').and.returnValue(
      of(existingBreeds),
    );

    service = TestBed.inject(BreedService);

    // Wait for initialization
    setTimeout(() => {
      // Should only add breeds that don't exist
      const addedBreeds = addSpy.calls.allArgs().map((args) => args[0]);
      expect(
        addedBreeds.find((b: any) => b.name === 'Labrador'),
      ).toBeUndefined();
      expect(
        addedBreeds.find((b: any) => b.name === 'Chihuahua'),
      ).toBeUndefined();
      done();
    }, 100);
  });

  it('should have default breeds for small, medium, and large sizes', () => {
    spyOn(BreedService.prototype, 'getData$').and.returnValue(of([]));
    service = TestBed.inject(BreedService);

    const defaults = (service as any).defaults;
    const smallBreeds = defaults.filter((b: any) => b.size === 'small');
    const mediumBreeds = defaults.filter((b: any) => b.size === 'medium');
    const largeBreeds = defaults.filter((b: any) => b.size === 'large');

    expect(smallBreeds.length).toBeGreaterThan(0);
    expect(mediumBreeds.length).toBeGreaterThan(0);
    expect(largeBreeds.length).toBeGreaterThan(0);
  });
});
