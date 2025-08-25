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
        name: 'Lieve van der Berg',
        email: 'lieve.vdb@example.com',
        phone: '0478/12.34.56',
        dogs: [{ name: 'Bello', breed: breeds[0] }], // Labrador Retriever
        isAnonymized: false,
      },
      {
        id: '2',
        name: 'Daan de Vries',
        email: 'daan.devries@example.com',
        phone: '0499/23.45.67',
        dogs: [{ name: 'Spike', breed: breeds[3] }], // Duitse Herder
        isAnonymized: false,
      },
      {
        id: '3',
        name: 'Fatima El Amrani',
        email: 'fatima.elamrani@example.com',
        phone: '0488/34.56.78',
        dogs: [
          { name: 'Luna', breed: breeds[5] }, // Beagle
          { name: 'Sam', breed: breeds[6] }, // Teckel
        ],
        isAnonymized: false,
      },
      {
        id: '4',
        name: 'Yannick Dubois',
        email: 'yannick.dubois@example.com',
        phone: '0477/45.67.89',
        dogs: [{ name: 'Zoe', breed: breeds[7] }], // Boxer
        isAnonymized: false,
      },
      {
        id: '5',
        name: 'Sofie Peeters',
        email: 'sofie.peeters@example.com',
        phone: '0466/56.78.90',
        dogs: [{ name: 'Woezel', breed: breeds[8] }], // Shih Tzu
        isAnonymized: false,
      },
      {
        id: '6',
        name: "Liam O'Connell",
        email: 'liam.oconnell@example.com',
        phone: '0455/67.89.01',
        dogs: [{ name: 'Finn', breed: breeds[9] }], // Yorkshire Terrier
        isAnonymized: false,
      },
      {
        id: '7',
        name: 'Isabella Rossi',
        email: 'isabella.rossi@example.com',
        phone: '0444/78.90.12',
        dogs: [{ name: 'Leo', breed: breeds[1] }], // Golden Retriever
        isAnonymized: false,
      },
      {
        id: '8',
        name: 'Mateo Garcia',
        email: 'mateo.garcia@example.com',
        phone: '0433/89.01.23',
        dogs: [{ name: 'Coco', breed: breeds[2] }], // Poedel
        isAnonymized: false,
      },
      {
        id: '9',
        name: 'Hanna Schulz',
        email: 'hanna.schulz@example.com',
        phone: '0422/90.12.34',
        dogs: [{ name: 'Rocky', breed: breeds[4] }], // Franse Bulldog
        isAnonymized: false,
      },
      {
        id: '10',
        name: 'Kenji Tanaka',
        email: 'kenji.tanaka@example.com',
        phone: '0411/01.23.45',
        dogs: [{ name: 'Hachi', breed: breeds[0] }], // Labrador Retriever
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
