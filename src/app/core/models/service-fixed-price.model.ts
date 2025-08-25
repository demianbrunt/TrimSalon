import { Breed } from './breed.model';
import { Price } from './price.model';

export interface ServiceFixedPrice {
  id?: string;
  breed?: Breed;
  prices: Price[];
  deletedAt?: Date;
}
