import { Injectable } from '@angular/core';
import { FIRESTORE_COLLECTION } from '../constants/firestore-collections';
import { Service } from '../models/service.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class ServiceService extends BaseService<Service> {
  constructor() {
    super(FIRESTORE_COLLECTION.services);
  }
}
