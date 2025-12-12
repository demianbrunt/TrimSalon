import { Breed } from './breed.model';

/**
 * Represents a dog in the system with all relevant information
 * for appointments and client management.
 */
export interface Dog {
  id?: string;
  name: string;
  breed: Breed;
  dateOfBirth?: Date | string; // Date of birth
  age?: number; // Age in years (derived or manual)
  gender?: 'male' | 'female';
  isNeutered?: boolean; // Castrated (male) or sterilized (female)
  isAggressive?: boolean; // Warning flag for aggressive behavior
  deletedAt?: Date;
}
