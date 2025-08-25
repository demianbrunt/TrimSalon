import { Price } from './price.model';
import { Service } from './service.model';

export interface Package {
  id?: string;
  name: string;
  services: Service[];
  prices: Price[];
  deletedAt?: Date;
}
