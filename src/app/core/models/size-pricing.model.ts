import { DogBreedSize } from './breed.model';

/**
 * Simplified pricing model based on dog size with optional breed-specific overrides
 */
export interface SizePricing {
  // Base pricing per dog size
  pricing: SizePricingValues;

  // Estimated duration in minutes per dog size
  duration: SizePricingValues;

  // Optional breed-specific adjustments
  breedOverrides?: BreedPricingOverride[];
}

/**
 * Pricing or duration values for each dog size
 */
export interface SizePricingValues {
  small: number;
  medium: number;
  large: number;
}

/**
 * Breed-specific pricing override for difficult breeds
 */
export interface BreedPricingOverride {
  breedId: string;
  breedName: string; // For display purposes
  /**
   * Optional override to treat a breed as a different size for this service/package.
   * Useful when a specific package should be priced/durationed as e.g. 'large' for a typically 'medium' breed.
   */
  sizeOverride?: DogBreedSize;
  priceAdjustment: number; // Additional price (can be negative)
  durationAdjustment: number; // Additional minutes (can be negative)
  reason?: string; // Optional explanation (e.g., "Thick coat, difficult behavior")
}

/**
 * Helper to get pricing/duration for a specific size
 */
export function getSizeValue(
  pricing: SizePricingValues,
  size: DogBreedSize,
): number {
  return pricing[size] || pricing.medium; // Default to medium if size unknown
}

/**
 * Helper to calculate effective hourly rate
 * Target is €60/hour
 */
export function calculateHourlyRate(
  totalPrice: number,
  totalMinutes: number,
): {
  effectiveRate: number;
  targetRate: number;
  percentageOfTarget: number;
  meetsTarget: boolean;
} {
  const TARGET_HOURLY_RATE = 60;

  if (totalMinutes === 0) {
    return {
      effectiveRate: 0,
      targetRate: TARGET_HOURLY_RATE,
      percentageOfTarget: 0,
      meetsTarget: false,
    };
  }

  const totalHours = totalMinutes / 60;
  const effectiveRate = totalPrice / totalHours;
  const percentageOfTarget = (effectiveRate / TARGET_HOURLY_RATE) * 100;

  return {
    effectiveRate,
    targetRate: TARGET_HOURLY_RATE,
    percentageOfTarget,
    meetsTarget: effectiveRate >= TARGET_HOURLY_RATE,
  };
}
