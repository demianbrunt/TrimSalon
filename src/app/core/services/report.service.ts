import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { PaymentStatus } from '../models/invoice.model';
import {
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
import { AppSettingsService } from './app-settings.service';
import { AppointmentService } from './appointment.service';
import { ExpenseService } from './expense.service';
import { InvoiceService } from './invoice.service';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private appointmentService = inject(AppointmentService);
  private invoiceService = inject(InvoiceService);
  private expenseService = inject(ExpenseService);
  private appSettingsService = inject(AppSettingsService);

  private isActiveAppointment(appointment: { deletedAt?: Date }): boolean {
    return !appointment.deletedAt;
  }

  private isActiveInvoice(invoice: { deletedAt?: Date }): boolean {
    return !invoice.deletedAt;
  }

  private toDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return value;
    }
    if (value && typeof value === 'object' && 'toDate' in value) {
      const candidate = value as { toDate?: unknown };
      if (typeof candidate.toDate === 'function') {
        return (candidate.toDate as () => Date)();
      }
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return null;
  }

  /**
   * Generate revenue report for a given period
   */
  getRevenueReport(period: ReportPeriod): Observable<RevenueReport> {
    return this.invoiceService.getData$().pipe(
      map((invoices) => {
        const filteredInvoices = invoices.filter((invoice) => {
          const issueDate = this.toDate(invoice.issueDate);
          return (
            this.isActiveInvoice(invoice) &&
            issueDate &&
            issueDate >= period.startDate &&
            issueDate <= period.endDate &&
            invoice.paymentStatus === PaymentStatus.PAID
          );
        });

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
        const filteredExpenses = expenses.filter((expense) => {
          const date = this.toDate(expense.date);
          return (
            !expense.deletedAt &&
            date &&
            date >= period.startDate &&
            date <= period.endDate
          );
        });

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
        const filteredAppointments = appointments.filter((apt) => {
          if (!apt.startTime) return false;
          const startTime = this.toDate(apt.startTime);
          return (
            this.isActiveAppointment(apt) &&
            startTime &&
            startTime >= period.startDate &&
            startTime <= period.endDate
          );
        });

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
          const clientInvoices = invoices.filter((inv) => {
            const issueDate = this.toDate(inv.issueDate);
            return (
              this.isActiveInvoice(inv) &&
              inv.client.id === clientId &&
              issueDate &&
              issueDate >= period.startDate &&
              issueDate <= period.endDate &&
              inv.paymentStatus === PaymentStatus.PAID
            );
          });
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
        const filteredAppointments = appointments.filter((apt) => {
          if (!apt.startTime) return false;
          const startTime = this.toDate(apt.startTime);
          return (
            this.isActiveAppointment(apt) &&
            startTime &&
            startTime >= period.startDate &&
            startTime <= period.endDate
          );
        });

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
        const filteredAppointments = appointments.filter((apt) => {
          if (!apt.startTime) return false;
          const startTime = this.toDate(apt.startTime);
          return (
            this.isActiveAppointment(apt) &&
            startTime &&
            startTime >= period.startDate &&
            startTime <= period.endDate
          );
        });

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
    return combineLatest([
      this.appointmentService.getData$(),
      this.appSettingsService.settings$,
    ]).pipe(
      map(([appointments, settings]) => {
        const filteredAppointments = appointments.filter((apt) => {
          if (!apt.startTime) return false;
          const startTime = this.toDate(apt.startTime);
          return (
            this.isActiveAppointment(apt) &&
            startTime &&
            startTime >= period.startDate &&
            startTime <= period.endDate
          );
        });

        // Calculate total booked hours
        const totalBookedHours = filteredAppointments.reduce((sum, apt) => {
          const startTime = this.toDate(apt.startTime);
          const endTime = this.toDate(apt.endTime);
          if (startTime && endTime) {
            const hours =
              (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);

        const weeklyTargetHours = settings.weeklyAvailableHoursTarget;

        const msPerDay = 1000 * 60 * 60 * 24;
        const diffMs = period.endDate.getTime() - period.startDate.getTime();

        // Inclusive, timezone-safe day span.
        // - If start=end => 1 day
        // - If end<start => 0 days
        const daysInPeriod =
          diffMs >= 0 ? Math.ceil((diffMs + 1) / msPerDay) : 0;

        // Pro-rate weekly target by the number of days in the selected period.
        const totalAvailableHours =
          daysInPeriod > 0 ? (daysInPeriod / 7) * weeklyTargetHours : 0;

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
      this.appSettingsService.settings$,
    ]).pipe(
      map(([appointments, invoices, expenses, settings]) => {
        const targetHourlyRate = settings.targetHourlyRate;

        // Filter appointments in period
        const filteredAppointments = appointments.filter((apt) => {
          if (!apt.startTime) return false;
          const startTime = this.toDate(apt.startTime);
          return (
            this.isActiveAppointment(apt) &&
            startTime &&
            startTime >= period.startDate &&
            startTime <= period.endDate &&
            apt.completed
          );
        });

        // Derive worked minutes from actual (or planned) appointment durations.
        let totalActiveMinutes = 0;
        filteredAppointments.forEach((apt) => {
          const startTime = this.toDate(apt.startTime);
          const actualEndTime = apt.actualEndTime
            ? this.toDate(apt.actualEndTime)
            : null;
          const endTime = apt.endTime ? this.toDate(apt.endTime) : null;

          if (startTime && actualEndTime) {
            totalActiveMinutes += Math.max(
              0,
              Math.round(
                (actualEndTime.getTime() - startTime.getTime()) / 60000,
              ),
            );
            return;
          }

          if (startTime && endTime) {
            totalActiveMinutes += Math.max(
              0,
              Math.round((endTime.getTime() - startTime.getTime()) / 60000),
            );
          }
        });

        const totalHoursWorked = totalActiveMinutes / 60;

        // Calculate revenue from paid invoices
        const totalRevenue = invoices
          .filter((inv) => {
            const issueDate = this.toDate(inv.issueDate);
            return (
              this.isActiveInvoice(inv) &&
              issueDate &&
              issueDate >= period.startDate &&
              issueDate <= period.endDate &&
              inv.paymentStatus === PaymentStatus.PAID
            );
          })
          .reduce((sum, inv) => sum + inv.totalAmount, 0);

        // Calculate expenses
        const totalExpenses = expenses
          .filter((exp) => {
            const date = this.toDate(exp.date);
            return (
              !exp.deletedAt &&
              date &&
              date >= period.startDate &&
              date <= period.endDate
            );
          })
          .reduce((sum, exp) => sum + exp.amount, 0);

        // Calculate rates
        const actualHourlyRate =
          totalHoursWorked > 0 ? totalRevenue / totalHoursWorked : 0;
        const netHourlyRate =
          totalHoursWorked > 0
            ? (totalRevenue - totalExpenses) / totalHoursWorked
            : 0;
        const percentageOfTarget =
          targetHourlyRate > 0
            ? (actualHourlyRate / targetHourlyRate) * 100
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
          targetHourlyRate,
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
   * Get performance metrics by dog breed.
   */
  getBreedPerformance(period: ReportPeriod): Observable<BreedPerformance[]> {
    return combineLatest([
      this.appointmentService.getData$(),
      this.invoiceService.getData$(),
    ]).pipe(
      map(([appointments, invoices]) => {
        const filteredAppointments = appointments.filter((apt) => {
          if (!apt.startTime) return false;
          const startTime = this.toDate(apt.startTime);
          return (
            this.isActiveAppointment(apt) &&
            startTime &&
            startTime >= period.startDate &&
            startTime <= period.endDate &&
            apt.completed
          );
        });

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
              this.isActiveInvoice(inv) &&
              (inv.appointmentId ?? inv.appointment?.id) === apt.id &&
              inv.paymentStatus === PaymentStatus.PAID,
          );
          if (relatedInvoice) {
            data.totalRevenue += relatedInvoice.totalAmount;
          }

          // Get minutes worked
          const startTime = this.toDate(apt.startTime);
          const actualEndTime = this.toDate(apt.actualEndTime);
          const endTime = this.toDate(apt.endTime);

          if (startTime && actualEndTime) {
            data.totalMinutes += Math.round(
              (actualEndTime.getTime() - startTime.getTime()) / 60000,
            );
          } else if (startTime && endTime) {
            data.totalMinutes += Math.round(
              (endTime.getTime() - startTime.getTime()) / 60000,
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
