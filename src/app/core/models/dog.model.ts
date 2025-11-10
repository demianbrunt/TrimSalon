import { Breed } from './breed.model';

export interface Dog {
  id?: string;
  name: string;
  breed: Breed;
  age?: number;
  gender?: 'male' | 'female';
  isNeutered?: boolean;
  isAggressive?: boolean;
  deletedAt?: Date;
}
