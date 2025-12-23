export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
}

export interface RevenueReport {
  period: ReportPeriod;
  totalRevenue: number;
  appointmentCount: number;
  averageRevenuePerAppointment: number;
}

export interface ExpenseReport {
  period: ReportPeriod;
  totalExpenses: number;
  expenseCount: number;
  averageExpense: number;
}

export interface ProfitLossReport {
  period: ReportPeriod;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number; // percentage
  breakEven: boolean;
  totalMinutesWorked?: number;
  effectiveHourlyRate?: number; // €/hour
}

/**
 * Hourly rate KPI for tracking against €60/hour target.
 */
export interface HourlyRateKPI {
  period: ReportPeriod;
  targetHourlyRate: number; // Default: 60
  actualHourlyRate: number;
  netHourlyRate: number; // After expenses
  totalRevenue: number;
  totalExpenses: number;
  totalHoursWorked: number;
  totalActiveMinutes: number;
  percentageOfTarget: number;
  status: 'BELOW' | 'APPROACHING' | 'TARGET' | 'EXCEEDING';
}

/**
 * Performance by dog breed for optimization insights.
 */
export interface BreedPerformance {
  breedName: string;
  appointmentCount: number;
  totalRevenue: number;
  averageRevenue: number;
  averageMinutesWorked: number;
  effectiveHourlyRate: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  appointmentCount: number;
  totalRevenue: number;
}

export interface PopularService {
  serviceId: string;
  serviceName: string;
  usageCount: number;
  totalRevenue: number;
}

export interface PopularPackage {
  packageId: string;
  packageName: string;
  usageCount: number;
  totalRevenue: number;
}

export interface CalendarOccupancy {
  period: ReportPeriod;
  totalAvailableHours: number;
  totalBookedHours: number;
  occupancyRate: number; // percentage
}

export interface DashboardReport {
  revenueReport: RevenueReport;
  expenseReport: ExpenseReport;
  profitLossReport: ProfitLossReport;
  topClients: TopClient[];
  popularServices: PopularService[];
  popularPackages: PopularPackage[];
  occupancy: CalendarOccupancy;
  hourlyRateKPI?: HourlyRateKPI;
  breedPerformance?: BreedPerformance[];
}
