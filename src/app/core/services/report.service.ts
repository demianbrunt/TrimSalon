import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import {
  DashboardReport,
  ExpenseReport,
  PopularPackage,
  PopularService,
  ProfitLossReport,
  ReportPeriod,
  RevenueReport,
  TopClient,
  CalendarOccupancy,
} from '../models/report.model';
import { AppointmentService } from './appointment.service';
import { ExpenseService } from './expense.service';
import { InvoiceService } from './invoice.service';
import { PaymentStatus } from '../models/invoice.model';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private appointmentService = inject(AppointmentService);
  private invoiceService = inject(InvoiceService);
  private expenseService = inject(ExpenseService);

  /**
   * Generate revenue report for a given period
   */
  getRevenueReport(period: ReportPeriod): Observable<RevenueReport> {
    return this.invoiceService.getData$().pipe(
      map((invoices) => {
        const filteredInvoices = invoices.filter(
          (invoice) =>
            invoice.issueDate >= period.startDate &&
            invoice.issueDate <= period.endDate &&
            invoice.paymentStatus === PaymentStatus.PAID,
        );

        const totalRevenue = filteredInvoices.reduce(
          (sum, inv) => sum + inv.totalAmount,
          0,
        );
        const appointmentCount = filteredInvoices.length;
        const averageRevenuePerAppointment =
          appointmentCount > 0 ? totalRevenue / appointmentCount : 0;

        return {
          period,
          totalRevenue,
          appointmentCount,
          averageRevenuePerAppointment,
        };
      }),
    );
  }

  /**
   * Generate expense report for a given period
   */
  getExpenseReport(period: ReportPeriod): Observable<ExpenseReport> {
    return this.expenseService.getData$().pipe(
      map((expenses) => {
        const filteredExpenses = expenses.filter(
          (expense) =>
            !expense.deletedAt &&
            expense.date >= period.startDate &&
            expense.date <= period.endDate,
        );

        const totalExpenses = filteredExpenses.reduce(
          (sum, expense) => sum + expense.amount,
          0,
        );
        const expenseCount = filteredExpenses.length;
        const averageExpense =
          expenseCount > 0 ? totalExpenses / expenseCount : 0;

        return {
          period,
          totalExpenses,
          expenseCount,
          averageExpense,
        };
      }),
    );
  }

  /**
   * Generate profit/loss report for a given period
   */
  getProfitLossReport(period: ReportPeriod): Observable<ProfitLossReport> {
    return combineLatest([
      this.getRevenueReport(period),
      this.getExpenseReport(period),
    ]).pipe(
      map(([revenueReport, expenseReport]) => {
        const totalRevenue = revenueReport.totalRevenue;
        const totalExpenses = expenseReport.totalExpenses;
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin =
          totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const breakEven = netProfit >= 0;

        return {
          period,
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin,
          breakEven,
        };
      }),
    );
  }

  /**
   * Get top clients by visit count
   */
  getTopClients(period: ReportPeriod, limit = 10): Observable<TopClient[]> {
    return combineLatest([
      this.appointmentService.getData$(),
      this.invoiceService.getData$(),
    ]).pipe(
      map(([appointments, invoices]) => {
        const filteredAppointments = appointments.filter(
          (apt) =>
            apt.startTime &&
            apt.startTime >= period.startDate &&
            apt.startTime <= period.endDate,
        );

        // Group by client
        const clientMap = new Map<string, TopClient>();

        filteredAppointments.forEach((apt) => {
          const clientId = apt.client.id || '';
          const clientName = apt.client.name;

          if (!clientMap.has(clientId)) {
            clientMap.set(clientId, {
              clientId,
              clientName,
              appointmentCount: 0,
              totalRevenue: 0,
            });
          }

          const client = clientMap.get(clientId)!;
          client.appointmentCount++;

          // Calculate revenue from invoices for this client
          const clientInvoices = invoices.filter(
            (inv) =>
              inv.client.id === clientId &&
              inv.paymentStatus === PaymentStatus.PAID,
          );
          client.totalRevenue = clientInvoices.reduce(
            (sum, inv) => sum + inv.totalAmount,
            0,
          );
        });

        // Sort by appointment count and limit
        return Array.from(clientMap.values())
          .sort((a, b) => b.appointmentCount - a.appointmentCount)
          .slice(0, limit);
      }),
    );
  }

  /**
   * Get most popular services
   */
  getPopularServices(
    period: ReportPeriod,
    limit = 10,
  ): Observable<PopularService[]> {
    return this.appointmentService.getData$().pipe(
      map((appointments) => {
        const filteredAppointments = appointments.filter(
          (apt) =>
            apt.startTime &&
            apt.startTime >= period.startDate &&
            apt.startTime <= period.endDate,
        );

        // Count service usage
        const serviceMap = new Map<string, PopularService>();

        filteredAppointments.forEach((apt) => {
          apt.services?.forEach((service) => {
            const serviceId = service.id || '';
            const serviceName = service.name;

            if (!serviceMap.has(serviceId)) {
              serviceMap.set(serviceId, {
                serviceId,
                serviceName,
                usageCount: 0,
                totalRevenue: 0,
              });
            }

            const svc = serviceMap.get(serviceId)!;
            svc.usageCount++;
            // Note: Revenue calculation would need price data from invoices
          });
        });

        // Sort by usage count and limit
        return Array.from(serviceMap.values())
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit);
      }),
    );
  }

  /**
   * Get most popular packages
   */
  getPopularPackages(
    period: ReportPeriod,
    limit = 10,
  ): Observable<PopularPackage[]> {
    return this.appointmentService.getData$().pipe(
      map((appointments) => {
        const filteredAppointments = appointments.filter(
          (apt) =>
            apt.startTime &&
            apt.startTime >= period.startDate &&
            apt.startTime <= period.endDate,
        );

        // Count package usage
        const packageMap = new Map<string, PopularPackage>();

        filteredAppointments.forEach((apt) => {
          apt.packages?.forEach((pkg) => {
            const packageId = pkg.id || '';
            const packageName = pkg.name;

            if (!packageMap.has(packageId)) {
              packageMap.set(packageId, {
                packageId,
                packageName,
                usageCount: 0,
                totalRevenue: 0,
              });
            }

            const p = packageMap.get(packageId)!;
            p.usageCount++;
            // Note: Revenue calculation would need price data from invoices
          });
        });

        // Sort by usage count and limit
        return Array.from(packageMap.values())
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit);
      }),
    );
  }

  /**
   * Calculate calendar occupancy rate
   */
  getCalendarOccupancy(period: ReportPeriod): Observable<CalendarOccupancy> {
    return this.appointmentService.getData$().pipe(
      map((appointments) => {
        const filteredAppointments = appointments.filter(
          (apt) =>
            apt.startTime &&
            apt.startTime >= period.startDate &&
            apt.startTime <= period.endDate,
        );

        // Calculate total booked hours
        const totalBookedHours = filteredAppointments.reduce((sum, apt) => {
          if (apt.startTime && apt.endTime) {
            const hours =
              (apt.endTime.getTime() - apt.startTime.getTime()) /
              (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);

        // Calculate available hours (assuming 8 hours/day, 5 days/week)
        const days = Math.ceil(
          (period.endDate.getTime() - period.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const workingDays = Math.floor((days / 7) * 5); // Rough estimate
        const totalAvailableHours = workingDays * 8;

        const occupancyRate =
          totalAvailableHours > 0
            ? (totalBookedHours / totalAvailableHours) * 100
            : 0;

        return {
          period,
          totalAvailableHours,
          totalBookedHours,
          occupancyRate,
        };
      }),
    );
  }

  /**
   * Get complete dashboard report
   */
  getDashboardReport(period: ReportPeriod): Observable<DashboardReport> {
    return combineLatest([
      this.getRevenueReport(period),
      this.getExpenseReport(period),
      this.getProfitLossReport(period),
      this.getTopClients(period, 5),
      this.getPopularServices(period, 5),
      this.getPopularPackages(period, 5),
      this.getCalendarOccupancy(period),
    ]).pipe(
      map(
        ([
          revenueReport,
          expenseReport,
          profitLossReport,
          topClients,
          popularServices,
          popularPackages,
          occupancy,
        ]) => ({
          revenueReport,
          expenseReport,
          profitLossReport,
          topClients,
          popularServices,
          popularPackages,
          occupancy,
        }),
      ),
    );
  }
}
