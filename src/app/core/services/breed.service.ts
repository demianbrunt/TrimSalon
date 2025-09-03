import { Injectable } from '@angular/core';
import { Breed } from '../models/breed.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class BreedService extends BaseService<Breed> {
  constructor() {
    super('breeds');
  }
}
