import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Client } from '../models/client.model';
import { BaseService } from './base.service';
import { BreedService } from './breed.service';

@Injectable({
  providedIn: 'root',
})
export class ClientService extends BaseService<Client> {
  private breedService = inject(BreedService);
  constructor() {
    super();
    const breeds = this.breedService.getData();
    // Add mock data
    this.data = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        dogs: [{ name: 'Buddy', breed: breeds[2] }], // Poedel
        isAnonymized: false,
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '098-765-4321',
        dogs: [
          { name: 'Lucy', breed: breeds[4] }, // Franse Bulldog
          { name: 'Max', breed: breeds[1] }, // Golden Retriever
        ],
        isAnonymized: false,
      },
    ];
  }

  override getData$(): Observable<Client[]> {
    return of(this.data.filter((d) => !d.isAnonymized));
  }

  override getData(): Client[] {
    return this.data.filter((d) => !d.isAnonymized);
  }

  override delete(id: string): Observable<void> {
    const index = this.data.findIndex((d) => d.id === id);
    if (index > -1) {
      const client = this.data[index];
      client.name = 'Geanonimiseerde Klant';
      client.email = '';
      client.phone = '';
      client.dogs.forEach((dog) => (dog.name = 'Geanonimiseerd'));
      client.isAnonymized = true;
      // We don't set deletedAt, so it remains in the system forever
      // for historical integrity, but will be filtered by getData methods.
      return of(undefined);
    }
    return throwError(() => new Error('Client not found'));
  }
}
