export type DogBreedSize = 'small' | 'medium' | 'large';

export interface Breed {
  id?: string;
  name: string;
  size: DogBreedSize;
  deletedAt?: Date;
}
