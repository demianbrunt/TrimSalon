import { Price } from './price.model';
import { Service } from './service.model';
import { SizePricing } from './size-pricing.model';

export interface Package {
  id?: string;
  name: string;
  services: Service[];

  // New simplified pricing model
  sizePricing?: SizePricing;

  // @deprecated - Use sizePricing instead
  prices?: Price[];

  deletedAt?: Date;
}
