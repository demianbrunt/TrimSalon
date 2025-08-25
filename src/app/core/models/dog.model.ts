import { Breed } from './breed.model';

export interface Dog {
  id?: string;
  name: string;
  breed: Breed;
  deletedAt?: Date;
}
