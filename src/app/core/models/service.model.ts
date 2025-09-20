import { ServiceFixedPrice } from './service-fixed-price.model';
import { ServiceTimeRate } from './service-time-rate.model';

export type PricingType = 'FIXED' | 'TIME_BASED';

export class Service {
  id?: string;
  name: string;
  description: string;
  pricingType: PricingType;
  fixedPrices?: ServiceFixedPrice[];
  timeRates?: ServiceTimeRate[];
  deletedAt?: Date;
}
