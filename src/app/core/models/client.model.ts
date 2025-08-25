import { Dog } from './dog.model';

export interface Client {
  id?: string;
  name: string;
  email: string;
  phone: string;
  dogs: Dog[];
  isAnonymized?: boolean;
  deletedAt?: Date; // To satisfy BaseService, but will not be used for clients
}
