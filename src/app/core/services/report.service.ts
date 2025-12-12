import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { ACTIVITY_LABELS, ActivityType } from '../models/appointment.model';
import { PaymentStatus } from '../models/invoice.model';
import {
  ActivityBreakdown,
  BreedPerformance,
  CalendarOccupancy,
  DashboardReport,
  ExpenseReport,
  HourlyRateKPI,
  PopularPackage,
  PopularService,
  ProfitLossReport,
  ReportPeriod,
  RevenueReport,
  TopClient,
} from '../models/report.model';
import { AppointmentService } from './appointment.service';
import { ExpenseService } from './expense.service';
import { InvoiceService } from './invoice.service';

// Target hourly rate (configurable)
const TARGET_HOURLY_RATE = 60;

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
      this.getHourlyRateKPI(period),
      this.getActivityBreakdown(period),
      this.getBreedPerformance(period),
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
          hourlyRateKPI,
          activityBreakdown,
          breedPerformance,
        ]) => ({
          revenueReport,
          expenseReport,
          profitLossReport,
          topClients,
          popularServices,
          popularPackages,
          occupancy,
          hourlyRateKPI,
          activityBreakdown,
          breedPerformance,
        }),
      ),
    );
  }

  /**
   * Calculate the hourly rate KPI against the €60/hour target.
   */
  getHourlyRateKPI(period: ReportPeriod): Observable<HourlyRateKPI> {
    return combineLatest([
      this.appointmentService.getData$(),
      this.invoiceService.getData$(),
      this.expenseService.getData$(),
    ]).pipe(
      map(([appointments, invoices, expenses]) => {
        // Filter appointments in period
        const filteredAppointments = appointments.filter(
          (apt) =>
            apt.startTime &&
            apt.startTime >= period.startDate &&
            apt.startTime <= period.endDate &&
            apt.completed,
        );

        // Calculate total active minutes from time logs
        let totalActiveMinutes = 0;
        filteredAppointments.forEach((apt) => {
          if (apt.totalActiveMinutes) {
            totalActiveMinutes += apt.totalActiveMinutes;
          } else if (apt.timeLogs) {
            // Calculate from time logs if totalActiveMinutes not set
            totalActiveMinutes += apt.timeLogs
              .filter((log) => log.activity !== 'BREAK' && log.durationMinutes)
              .reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
          } else if (apt.startTime && apt.actualEndTime) {
            // Fallback to appointment duration
            totalActiveMinutes += Math.round(
              (apt.actualEndTime.getTime() - apt.startTime.getTime()) / 60000,
            );
          } else if (apt.startTime && apt.endTime) {
            // Fallback to estimated duration
            totalActiveMinutes += Math.round(
              (apt.endTime.getTime() - apt.startTime.getTime()) / 60000,
            );
          }
        });

        const totalHoursWorked = totalActiveMinutes / 60;

        // Calculate revenue from paid invoices
        const totalRevenue = invoices
          .filter(
            (inv) =>
              inv.issueDate >= period.startDate &&
              inv.issueDate <= period.endDate &&
              inv.paymentStatus === PaymentStatus.PAID,
          )
          .reduce((sum, inv) => sum + inv.totalAmount, 0);

        // Calculate expenses
        const totalExpenses = expenses
          .filter(
            (exp) =>
              !exp.deletedAt &&
              exp.date >= period.startDate &&
              exp.date <= period.endDate,
          )
          .reduce((sum, exp) => sum + exp.amount, 0);

        // Calculate rates
        const actualHourlyRate =
          totalHoursWorked > 0 ? totalRevenue / totalHoursWorked : 0;
        const netHourlyRate =
          totalHoursWorked > 0
            ? (totalRevenue - totalExpenses) / totalHoursWorked
            : 0;
        const percentageOfTarget =
          TARGET_HOURLY_RATE > 0
            ? (actualHourlyRate / TARGET_HOURLY_RATE) * 100
            : 0;

        // Determine status
        let status: 'BELOW' | 'APPROACHING' | 'TARGET' | 'EXCEEDING';
        if (percentageOfTarget < 83) {
          status = 'BELOW'; // < €50
        } else if (percentageOfTarget < 100) {
          status = 'APPROACHING'; // €50-60
        } else if (percentageOfTarget <= 110) {
          status = 'TARGET'; // €60-66
        } else {
          status = 'EXCEEDING'; // > €66
        }

        return {
          period,
          targetHourlyRate: TARGET_HOURLY_RATE,
          actualHourlyRate,
          netHourlyRate,
          totalRevenue,
          totalExpenses,
          totalHoursWorked,
          totalActiveMinutes,
          percentageOfTarget,
          status,
        };
      }),
    );
  }

  /**
   * Get breakdown of time spent on each activity type.
   */
  getActivityBreakdown(period: ReportPeriod): Observable<ActivityBreakdown[]> {
    return this.appointmentService.getData$().pipe(
      map((appointments) => {
        const filteredAppointments = appointments.filter(
          (apt) =>
            apt.startTime &&
            apt.startTime >= period.startDate &&
            apt.startTime <= period.endDate &&
            apt.timeLogs &&
            apt.timeLogs.length > 0,
        );

        // Aggregate by activity
        const activityMap = new Map<
          ActivityType,
          { totalMinutes: number; count: number }
        >();

        filteredAppointments.forEach((apt) => {
          apt.timeLogs?.forEach((log) => {
            if (!activityMap.has(log.activity)) {
              activityMap.set(log.activity, { totalMinutes: 0, count: 0 });
            }
            const data = activityMap.get(log.activity)!;
            data.totalMinutes += log.durationMinutes || 0;
            data.count++;
          });
        });

        // Calculate totals
        let grandTotal = 0;
        activityMap.forEach((data) => {
          grandTotal += data.totalMinutes;
        });

        // Build breakdown
        const breakdown: ActivityBreakdown[] = [];
        activityMap.forEach((data, activity) => {
          breakdown.push({
            activity: ACTIVITY_LABELS[activity] || activity,
            totalMinutes: data.totalMinutes,
            averageMinutesPerAppointment:
              data.count > 0 ? data.totalMinutes / data.count : 0,
            percentageOfTotal:
              grandTotal > 0 ? (data.totalMinutes / grandTotal) * 100 : 0,
          });
        });

        // Sort by total minutes descending
        return breakdown.sort((a, b) => b.totalMinutes - a.totalMinutes);
      }),
    );
  }

  /**
   * Get performance metrics by dog breed.
   */
  getBreedPerformance(period: ReportPeriod): Observable<BreedPerformance[]> {
    return combineLatest([
      this.appointmentService.getData$(),
      this.invoiceService.getData$(),
    ]).pipe(
      map(([appointments, invoices]) => {
        const filteredAppointments = appointments.filter(
          (apt) =>
            apt.startTime &&
            apt.startTime >= period.startDate &&
            apt.startTime <= period.endDate &&
            apt.completed,
        );

        // Group by breed
        const breedMap = new Map<
          string,
          {
            count: number;
            totalRevenue: number;
            totalMinutes: number;
          }
        >();

        filteredAppointments.forEach((apt) => {
          const breedName = apt.dog?.breed?.name || 'Onbekend';

          if (!breedMap.has(breedName)) {
            breedMap.set(breedName, {
              count: 0,
              totalRevenue: 0,
              totalMinutes: 0,
            });
          }

          const data = breedMap.get(breedName)!;
          data.count++;

          // Get revenue from invoice
          const relatedInvoice = invoices.find(
            (inv) =>
              inv.appointment?.id === apt.id &&
              inv.paymentStatus === PaymentStatus.PAID,
          );
          if (relatedInvoice) {
            data.totalRevenue += relatedInvoice.totalAmount;
          }

          // Get minutes worked
          if (apt.totalActiveMinutes) {
            data.totalMinutes += apt.totalActiveMinutes;
          } else if (apt.startTime && apt.actualEndTime) {
            data.totalMinutes += Math.round(
              (apt.actualEndTime.getTime() - apt.startTime.getTime()) / 60000,
            );
          }
        });

        // Build performance array
        const performance: BreedPerformance[] = [];
        breedMap.forEach((data, breedName) => {
          const averageMinutes =
            data.count > 0 ? data.totalMinutes / data.count : 0;
          const hoursWorked = data.totalMinutes / 60;
          performance.push({
            breedName,
            appointmentCount: data.count,
            totalRevenue: data.totalRevenue,
            averageRevenue: data.count > 0 ? data.totalRevenue / data.count : 0,
            averageMinutesWorked: averageMinutes,
            effectiveHourlyRate:
              hoursWorked > 0 ? data.totalRevenue / hoursWorked : 0,
          });
        });

        // Sort by effective hourly rate descending
        return performance.sort(
          (a, b) => b.effectiveHourlyRate - a.effectiveHourlyRate,
        );
      }),
    );
  }
}
