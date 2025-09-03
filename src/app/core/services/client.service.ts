import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Client } from '../models/client.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ClientService extends BaseService<Client> {
  constructor() {
    super('clients');
  }

  override getData$(): Observable<Client[]> {
    return super
      .getData$()
      .pipe(map((clients) => clients.filter((c) => !c.isAnonymized)));
  }

  override delete(id: string): Observable<void> {
    return this.getById(id).pipe(
      switchMap((client) => {
        if (client) {
          const anonymizedClient: Partial<Client> = {
            name: 'Geanonimiseerde Klant',
            email: '',
            phone: '',
            dogs: client.dogs.map((dog) => ({
              ...dog,
              name: 'Geanonimiseerd',
            })),
            isAnonymized: true,
          };
          return this.update({ ...client, ...anonymizedClient });
        }
        return of(undefined);
      }),
      map(() => undefined),
    );
  }
}
