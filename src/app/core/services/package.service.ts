import { Injectable } from '@angular/core';
import { Package } from '../models/package.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class PackageService extends BaseService<Package> {
  constructor() {
    super('packages');
  }
}
