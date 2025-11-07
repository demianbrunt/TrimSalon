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
}
