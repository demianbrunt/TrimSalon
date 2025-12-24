import { firstValueFrom, of } from 'rxjs';
import { BaseService } from './base.service';
import { ClientService } from './client.service';

describe('ClientService', () => {
  let service: ClientService;

  beforeEach(() => {
    service = Object.create(ClientService.prototype) as ClientService;
  });

  it('should be defined', () => {
    expect(ClientService).toBeDefined();
  });

  it('should exclude anonymized clients from getData$', async () => {
    spyOn(BaseService.prototype, 'getData$').and.returnValue(
      of([
        {
          id: '1',
          name: 'Alice',
          email: 'a@example.com',
          phone: '123',
          dogs: [],
          isAnonymized: false,
        },
        {
          id: '2',
          name: 'Geanonimiseerde Klant',
          email: '',
          phone: '',
          dogs: [],
          isAnonymized: true,
        },
      ]),
    );

    const result = await firstValueFrom(service.getData$());
    expect(result.map((c) => c.id)).toEqual(['1']);
  });

  it('should return only anonymized clients from getAnonymized$', async () => {
    spyOn(BaseService.prototype, 'getData$').and.returnValue(
      of([
        {
          id: '1',
          name: 'Alice',
          email: 'a@example.com',
          phone: '123',
          dogs: [],
          isAnonymized: false,
        },
        {
          id: '2',
          name: 'Geanonimiseerde Klant',
          email: '',
          phone: '',
          dogs: [],
          isAnonymized: true,
        },
      ]),
    );

    const result = await firstValueFrom(service.getAnonymized$());
    expect(result.map((c) => c.id)).toEqual(['2']);
  });

  // Note: Testing Firebase services properly requires either:
  // 1. Firebase Emulator for integration tests
  // 2. Mocking the service itself (not Firebase SDK)
  // 3. Testing business logic separately from Firebase calls
  //
  // The service is tested indirectly through higher-level component tests
});
