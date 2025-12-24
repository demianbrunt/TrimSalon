import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FIRESTORE_COLLECTION } from '../constants/firestore-collections';
import { Client } from '../models/client.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ClientService extends BaseService<Client> {
  constructor() {
    super(FIRESTORE_COLLECTION.clients);
  }

  override getData$(): Observable<Client[]> {
    return super
      .getData$()
      .pipe(map((clients) => clients.filter((c) => !c.isAnonymized)));
  }

  /**
   * "Archief" clients are clients that were anonymized.
   *
   * We keep them out of the default list, but still allow viewing them.
   */
  getAnonymized$(): Observable<Client[]> {
    return super
      .getData$()
      .pipe(map((clients) => clients.filter((c) => Boolean(c.isAnonymized))));
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
