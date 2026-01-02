export interface AppSettings {
  /**
   * KOR (Kleine Ondernemersregeling): when enabled, VAT should be 0% by default.
   */
  korEnabled: boolean;

  /**
   * Default VAT rate (percentage) used when creating new invoices.
   * Typical values: 21, 9, 0.
   */
  defaultVatRate: number;

  /**
   * Target hourly rate used in reporting (€/hour).
   */
  targetHourlyRate: number;

  /**
   * Weekly available hours used for occupancy reporting (hours/week).
   */
  weeklyAvailableHoursTarget: number;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  korEnabled: false,
  defaultVatRate: 21,
  targetHourlyRate: 60,
  weeklyAvailableHoursTarget: 8,
};
