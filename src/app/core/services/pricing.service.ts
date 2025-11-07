import { Injectable } from '@angular/core';
import { Breed } from '../models/breed.model';
import { Package } from '../models/package.model';
import { Price } from '../models/price.model';
import { Service } from '../models/service.model';

export interface PriceCalculation {
  totalPrice: number;
  breakdown: PriceBreakdownItem[];
}

export interface PriceBreakdownItem {
  name: string;
  price: number;
  type: 'service' | 'package';
}

export interface HourlyRateCalculation {
  effectiveHourlyRate: number;
  totalPrice: number;
  totalMinutes: number;
  targetRate: number;
  rateComparison: number; // Percentage of target rate achieved
}

@Injectable({
  providedIn: 'root',
})
export class PricingService {
  private readonly TARGET_HOURLY_RATE = 60; // €60 per hour target
  private readonly BASE_TIMES = {
    small: 30,
    medium: 45,
    large: 60,
  };
  private readonly MINUTES_PER_PACKAGE_SERVICE = 15;
  private readonly MINUTES_PER_EXTRA_SERVICE = 15;

  /**
   * Calculate total price for selected services and packages
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
        const price = this.getPackagePrice(pkg);
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
    const rateComparison = (effectiveHourlyRate / this.TARGET_HOURLY_RATE) * 100;

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
  private getPackagePrice(pkg: Package): number {
    if (!pkg.prices || pkg.prices.length === 0) {
      return 0;
    }

    // Get current price (most recent active price)
    const currentPrice = this.getCurrentPrice(pkg.prices);
    return currentPrice?.amount || 0;
  }

  /**
   * Get current price for a service based on breed
   */
  private getServicePrice(service: Service, breed?: Breed): number {
    if (service.pricingType === 'FIXED') {
      return this.getFixedServicePrice(service, breed);
    } else if (service.pricingType === 'TIME_BASED') {
      // For time-based services, we need duration which we don't have here
      // This would typically be calculated during appointment with actual time
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
        const pkgServices = pkg.services || [];
        totalMinutes += pkgServices.length * this.MINUTES_PER_PACKAGE_SERVICE;
        totalPrice += this.getPackagePrice(pkg);
      });
    }

    // Add time for services and calculate service prices
    if (services) {
      services.forEach((service) => {
        if (service.pricingType === 'FIXED') {
          totalMinutes += this.MINUTES_PER_EXTRA_SERVICE;
          totalPrice += this.getFixedServicePrice(service, breed);
        } else if (service.pricingType === 'TIME_BASED') {
          // For time-based, estimate and calculate price
          const estimatedMinutes = this.MINUTES_PER_EXTRA_SERVICE;
          totalMinutes += estimatedMinutes;
          totalPrice += this.getTimeBasedServicePrice(
            service,
            estimatedMinutes,
            breed,
          );
        }
      });
    }

    return { minutes: totalMinutes, price: totalPrice };
  }

  getTargetHourlyRate(): number {
    return this.TARGET_HOURLY_RATE;
  }
}
