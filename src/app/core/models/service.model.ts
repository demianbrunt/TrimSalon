import { ServiceFixedPrice } from './service-fixed-price.model';
import { ServiceTimeRate } from './service-time-rate.model';
import { SizePricing } from './size-pricing.model';

export type PricingType = 'FIXED' | 'TIME_BASED';

export class Service {
  id?: string;
  name: string;
  description: string;

  // New simplified pricing model
  sizePricing?: SizePricing;

  // @deprecated - Use sizePricing instead
  pricingType?: PricingType;
  // @deprecated - Use sizePricing instead
  fixedPrices?: ServiceFixedPrice[];
  // @deprecated - Use sizePricing instead
  timeRates?: ServiceTimeRate[];

  deletedAt?: Date;
}
