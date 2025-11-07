import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { ClientService } from './client.service';
import { createMockFirestore } from '../../../test-helpers/firebase-mocks';
import { TestDataFactory } from '../../../test-helpers/test-data-factory';

describe('ClientService', () => {
  let service: ClientService;
  let mockFirestore: any;

  beforeEach(() => {
    mockFirestore = createMockFirestore();

    TestBed.configureTestingModule({
      providers: [
        ClientService,
        { provide: Firestore, useValue: mockFirestore },
      ],
    });

    service = TestBed.inject(ClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should use "clients" collection', () => {
    expect((service as any).collection.path).toBe('clients');
  });

  describe('getData$', () => {
    it('should filter out anonymized clients', (done) => {
      const clients = [
        TestDataFactory.createClient({
          id: '1',
          name: 'Client 1',
          isAnonymized: false,
        }),
        TestDataFactory.createClient({
          id: '2',
          name: 'Geanonimiseerde Klant',
          isAnonymized: true,
        }),
        TestDataFactory.createClient({
          id: '3',
          name: 'Client 3',
          isAnonymized: false,
        }),
      ];

      spyOn<any>(Object.getPrototypeOf(service), 'getData$').and.returnValue(
        of(clients),
      );

      service.getData$().subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result.find((c) => c.id === '2')).toBeUndefined();
        done();
      });
    });
  });

  describe('delete', () => {
    it('should anonymize client instead of deleting', (done) => {
      const client = TestDataFactory.createClient({
        id: '1',
        name: 'Test Client',
        email: 'test@example.com',
        phone: '0612345678',
        dogs: [{ id: 'dog-1', name: 'Rex', breed: 'Labrador' }],
      });

      spyOn(service, 'getById').and.returnValue(of(client));
      spyOn(service, 'update').and.returnValue(
        of({ ...client, isAnonymized: true }),
      );

      service.delete('1').subscribe(() => {
        expect(service.update).toHaveBeenCalledWith(
          jasmine.objectContaining({
            id: '1',
            name: 'Geanonimiseerde Klant',
            email: '',
            phone: '',
            isAnonymized: true,
          }),
        );
        done();
      });
    });

    it('should anonymize dog names when anonymizing client', (done) => {
      const client = TestDataFactory.createClient({
        id: '1',
        dogs: [
          { id: 'dog-1', name: 'Rex', breed: 'Labrador' },
          { id: 'dog-2', name: 'Max', breed: 'Poodle' },
        ],
      });

      spyOn(service, 'getById').and.returnValue(of(client));
      spyOn(service, 'update').and.returnValue(
        of({ ...client, isAnonymized: true }),
      );

      service.delete('1').subscribe(() => {
        const updateCall = (service.update as jasmine.Spy).calls.mostRecent()
          .args[0];
        expect(updateCall.dogs[0].name).toBe('Geanonimiseerd');
        expect(updateCall.dogs[1].name).toBe('Geanonimiseerd');
        done();
      });
    });
  });
});
