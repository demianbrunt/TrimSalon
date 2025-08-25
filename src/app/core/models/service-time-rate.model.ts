import { Breed } from './breed.model';
import { Price } from './price.model';

export interface ServiceTimeRate {
  id?: string;
  breed?: Breed;
  rates: Price[];
  deletedAt?: Date;
}
