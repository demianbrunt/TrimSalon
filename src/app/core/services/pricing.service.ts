import { Injectable } from '@angular/core';
import { Breed } from '../models/breed.model';
import { Package } from '../models/package.model';
import { Price } from '../models/price.model';
import { Service } from '../models/service.model';
import { getSizeValue } from '../models/size-pricing.model';

/**
 * Interface voor prijs berekening resultaat
 */
export interface PriceCalculation {
  totalPrice: number;
  breakdown: PriceBreakdownItem[]; // Gedetailleerde breakdown per service/package
}

/**
 * Interface voor prijs breakdown item
 */
export interface PriceBreakdownItem {
  name: string;
  price: number;
  type: 'service' | 'package';
}

/**
 * Interface voor uurtarief berekening
 */
export interface HourlyRateCalculation {
  effectiveHourlyRate: number; // Berekend uurtarief
  totalPrice: number;
  totalMinutes: number;
  targetRate: number; // Doel uurtarief (€60)
  rateComparison: number; // Percentage van doel (100% = doel bereikt)
}

/**
 * PricingService
 *
 * Berekent prijzen voor services en packages op basis van hondenras/grootte.
 *
 * TWEE PRICING MODELLEN:
 * 1. Size-based pricing (NIEUW, AANBEVOLEN)
 *    - Prijs per hondgrootte (small/medium/large)
 *    - Breed-specific overrides voor moeilijke rassen
 *    - Wordt gebruikt in sizePricing property
 *
 * 2. Legacy pricing (DEPRECATED)
 *    - Fixed price of time-based
 *    - Gebruik dit NIET voor nieuwe services!
 *
 * PRICING STRATEGIE:
 * - Doel uurtarief: €60/uur
 * - Bereken totale prijs en tijd om uurtarief te checken
 * - Pas prijzen aan als uurtarief te laag is
 *
 * @example
 * // Bereken totale prijs
 * const calc = pricingService.calculateTotalPrice(
 *   [bathService, trimService],
 *   [fullGroomPackage],
 *   labradorBreed
 * );
 * // calc.totalPrice -> 75
 * // calc.breakdown -> [{name: 'Bath', price: 25}, ...]
 *
 * // Check uurtarief
 * const rate = pricingService.calculateHourlyRate(75, 60);
 * // rate.effectiveHourlyRate -> 75
 * // rate.rateComparison -> 125% (boven target!)
 */
@Injectable({
  providedIn: 'root',
})
export class PricingService {
  // BELANGRIJKE CONSTANTEN
  private readonly TARGET_HOURLY_RATE = 60; // €60 per uur is het doel
  private readonly BASE_TIMES = {
    small: 30, // 30 min voor kleine honden
    medium: 45, // 45 min voor middelgrote honden
    large: 60, // 60 min voor grote honden
  };
  private readonly MINUTES_PER_PACKAGE_SERVICE = 15;
  private readonly MINUTES_PER_EXTRA_SERVICE = 15;

  /**
   * Bereken totale prijs voor geselecteerde services en packages
   *
   * BELANGRIJK: Deze functie gebruikt het NIEUWE size-based pricing model.
   * Als een service/package geen sizePricing heeft, valt het terug op legacy pricing.
   *
   * @param services - Array van geselecteerde services
   * @param packages - Array van geselecteerde packages
   * @param breed - Het hondenras (voor grootte en breed-specific prijzen)
   * @returns PriceCalculation met totalPrice en breakdown
   */
  calculateTotalPrice(
    services: Service[],
    packages: Package[],
    breed?: Breed,
  ): PriceCalculation {
    const breakdown: PriceBreakdownItem[] = [];
    let totalPrice = 0;

    // Calculate package prices
    if (packages) {
      packages.forEach((pkg) => {
        const price = this.getPackagePrice(pkg, breed);
        if (price > 0) {
          breakdown.push({
            name: pkg.name,
            price: price,
            type: 'package',
          });
          totalPrice += price;
        }
      });
    }

    // Calculate service prices
    if (services) {
      services.forEach((service) => {
        const price = this.getServicePrice(service, breed);
        if (price > 0) {
          breakdown.push({
            name: service.name,
            price: price,
            type: 'service',
          });
          totalPrice += price;
        }
      });
    }

    return {
      totalPrice,
      breakdown,
    };
  }

  /**
   * Calculate effective hourly rate
   */
  calculateHourlyRate(
    totalPrice: number,
    totalMinutes: number,
  ): HourlyRateCalculation {
    if (totalMinutes === 0) {
      return {
        effectiveHourlyRate: 0,
        totalPrice,
        totalMinutes,
        targetRate: this.TARGET_HOURLY_RATE,
        rateComparison: 0,
      };
    }

    const totalHours = totalMinutes / 60;
    const effectiveHourlyRate = totalPrice / totalHours;
    const rateComparison =
      (effectiveHourlyRate / this.TARGET_HOURLY_RATE) * 100;

    return {
      effectiveHourlyRate,
      totalPrice,
      totalMinutes,
      targetRate: this.TARGET_HOURLY_RATE,
      rateComparison,
    };
  }

  /**
   * Get current price for a package
   */
  private getPackagePrice(pkg: Package, breed?: Breed): number {
    // New simplified pricing model
    if (pkg.sizePricing && breed?.size) {
      const override =
        breed.id && pkg.sizePricing.breedOverrides
          ? pkg.sizePricing.breedOverrides.find((o) => o.breedId === breed.id)
          : undefined;

      const effectiveSize = override?.sizeOverride ?? breed.size;
      let price = getSizeValue(pkg.sizePricing.pricing, effectiveSize);

      if (override && override.priceAdjustment !== undefined) {
        price += override.priceAdjustment;
      }

      return price;
    }

    // Legacy pricing model (deprecated)
    if (!pkg.prices || pkg.prices.length === 0) {
      return 0;
    }

    const currentPrice = this.getCurrentPrice(pkg.prices);
    return currentPrice?.amount || 0;
  }

  /**
   * Get current price for a service based on breed
   */
  private getServicePrice(service: Service, breed?: Breed): number {
    // New simplified pricing model
    if (service.sizePricing && breed?.size) {
      const override =
        breed.id && service.sizePricing.breedOverrides
          ? service.sizePricing.breedOverrides.find(
              (o) => o.breedId === breed.id,
            )
          : undefined;

      const effectiveSize = override?.sizeOverride ?? breed.size;
      let price = getSizeValue(service.sizePricing.pricing, effectiveSize);

      if (override && override.priceAdjustment !== undefined) {
        price += override.priceAdjustment;
      }

      return price;
    }

    // Legacy pricing model (deprecated)
    if (service.pricingType === 'FIXED') {
      return this.getFixedServicePrice(service, breed);
    } else if (service.pricingType === 'TIME_BASED') {
      return 0;
    }
    return 0;
  }

  /**
   * Get fixed price for a service based on breed
   */
  private getFixedServicePrice(service: Service, breed?: Breed): number {
    if (!service.fixedPrices || service.fixedPrices.length === 0) {
      return 0;
    }

    // Try to find price for specific breed
    if (breed) {
      const breedPrice = service.fixedPrices.find(
        (fp) => fp.breed && fp.breed.id === breed.id,
      );
      if (breedPrice && breedPrice.prices) {
        const currentPrice = this.getCurrentPrice(breedPrice.prices);
        if (currentPrice) {
          return currentPrice.amount;
        }
      }
    }

    // Fall back to default price (no breed specified)
    const defaultPrice = service.fixedPrices.find((fp) => !fp.breed);
    if (defaultPrice && defaultPrice.prices) {
      const currentPrice = this.getCurrentPrice(defaultPrice.prices);
      return currentPrice?.amount || 0;
    }

    return 0;
  }

  /**
   * Get time-based price for a service
   */
  getTimeBasedServicePrice(
    service: Service,
    durationMinutes: number,
    breed?: Breed,
  ): number {
    if (
      service.pricingType !== 'TIME_BASED' ||
      !service.timeRates ||
      service.timeRates.length === 0
    ) {
      return 0;
    }

    let ratePerMinute = 0;

    // Try to find rate for specific breed
    if (breed) {
      const breedRate = service.timeRates.find(
        (tr) => tr.breed && tr.breed.id === breed.id,
      );
      if (breedRate && breedRate.rates) {
        const currentRate = this.getCurrentPrice(breedRate.rates);
        if (currentRate) {
          ratePerMinute = currentRate.amount;
        }
      }
    }

    // Fall back to default rate (no breed specified)
    if (ratePerMinute === 0) {
      const defaultRate = service.timeRates.find((tr) => !tr.breed);
      if (defaultRate && defaultRate.rates) {
        const currentRate = this.getCurrentPrice(defaultRate.rates);
        ratePerMinute = currentRate?.amount || 0;
      }
    }

    return ratePerMinute * durationMinutes;
  }

  /**
   * Get the current active price from a price history
   */
  private getCurrentPrice(prices: Price[]): Price | null {
    if (!prices || prices.length === 0) {
      return null;
    }

    const now = new Date();

    // Find price that is currently active
    const activePrice = prices.find((price) => {
      const fromDate = new Date(price.fromDate);
      const toDate = price.toDate ? new Date(price.toDate) : null;

      return fromDate <= now && (!toDate || toDate >= now);
    });

    if (activePrice) {
      return activePrice;
    }

    // If no active price found, get the most recent one
    const sortedPrices = [...prices].sort(
      (a, b) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime(),
    );

    return sortedPrices[0] || null;
  }

  /**
   * Calculate estimated duration and price including time-based services
   */
  calculateEstimatedDurationAndPrice(
    services: Service[],
    packages: Package[],
    breed?: Breed,
  ): { minutes: number; price: number } {
    let totalMinutes = 0;
    let totalPrice = 0;

    // Base time based on dog size
    if (breed) {
      const dogSize = breed.size || 'medium';
      totalMinutes += this.BASE_TIMES[dogSize] || this.BASE_TIMES.medium;
    }

    // Add time for packages and calculate package prices
    if (packages) {
      packages.forEach((pkg) => {
        // New simplified pricing model
        if (pkg.sizePricing && breed?.size) {
          const override =
            breed.id && pkg.sizePricing.breedOverrides
              ? pkg.sizePricing.breedOverrides.find(
                  (o) => o.breedId === breed.id,
                )
              : undefined;

          const effectiveSize = override?.sizeOverride ?? breed.size;
          let duration = getSizeValue(pkg.sizePricing.duration, effectiveSize);

          if (override && override.durationAdjustment !== undefined) {
            duration += override.durationAdjustment;
          }

          totalMinutes += duration;
        } else {
          // Legacy: estimate time based on services
          const pkgServices = pkg.services || [];
          totalMinutes += pkgServices.length * this.MINUTES_PER_PACKAGE_SERVICE;
        }

        totalPrice += this.getPackagePrice(pkg, breed);
      });
    }

    // Add time for services and calculate service prices
    if (services) {
      services.forEach((service) => {
        // New simplified pricing model
        if (service.sizePricing && breed?.size) {
          const override =
            breed.id && service.sizePricing.breedOverrides
              ? service.sizePricing.breedOverrides.find(
                  (o) => o.breedId === breed.id,
                )
              : undefined;

          const effectiveSize = override?.sizeOverride ?? breed.size;
          let duration = getSizeValue(
            service.sizePricing.duration,
            effectiveSize,
          );

          if (override && override.durationAdjustment !== undefined) {
            duration += override.durationAdjustment;
          }

          totalMinutes += duration;
          totalPrice += this.getServicePrice(service, breed);
        } else {
          // Legacy pricing model
          if (service.pricingType === 'FIXED') {
            totalMinutes += this.MINUTES_PER_EXTRA_SERVICE;
            totalPrice += this.getFixedServicePrice(service, breed);
          } else if (service.pricingType === 'TIME_BASED') {
            const estimatedMinutes = this.MINUTES_PER_EXTRA_SERVICE;
            totalMinutes += estimatedMinutes;
            totalPrice += this.getTimeBasedServicePrice(
              service,
              estimatedMinutes,
              breed,
            );
          }
        }
      });
    }

    return { minutes: totalMinutes, price: totalPrice };
  }

  getTargetHourlyRate(): number {
    return this.TARGET_HOURLY_RATE;
  }
}
