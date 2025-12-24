import { DogBreedSize } from './breed.model';

export interface BookingRequestDog {
  name: string;
  breedId: string;
  breedName: string | null;
  size: DogBreedSize | null;
  ageYears: number | null;
}

export interface BookingRequestSelection {
  packageId: string | null;
  packageName: string | null;
  serviceIds: string[];
  serviceNames: string[];
  estimatedTotal: number;
}

export interface BookingRequestOwner {
  name: string;
  phone: string;
}

export interface BookingRequestCreate {
  customerKey: string;
  requestedDate: Date;
  dog: BookingRequestDog;
  selection: BookingRequestSelection;
  owner: BookingRequestOwner;
}

export type BookingRequestStatus = 'NEW' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface BookingRequest extends BookingRequestCreate {
  id?: string;
  createdAt: Date;
  status: BookingRequestStatus;
}
