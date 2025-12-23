import { Injectable } from '@angular/core';
import { FIRESTORE_COLLECTION } from '../constants/firestore-collections';
import { Package } from '../models/package.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class PackageService extends BaseService<Package> {
  constructor() {
    super(FIRESTORE_COLLECTION.packages);
  }
}
