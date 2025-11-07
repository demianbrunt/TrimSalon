import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Observable } from 'rxjs';
import {
  DashboardReport,
  ReportPeriod,
  RevenueReport,
  TopClient,
  PopularService,
  PopularPackage,
  CalendarOccupancy,
} from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';
import { SubscriptionHolder } from '../../core/components/subscription-holder.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    DatePicker,
    ButtonModule,
    TableModule,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent extends SubscriptionHolder implements OnInit {
  private reportService = inject(ReportService);

  startDate: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  endDate: Date = new Date();

  dashboardReport$?: Observable<DashboardReport>;
  revenueReport?: RevenueReport;
  topClients?: TopClient[];
  popularServices?: PopularService[];
  popularPackages?: PopularPackage[];
  occupancy?: CalendarOccupancy;

  revenueChartData: unknown;
  revenueChartOptions: unknown;

  ngOnInit(): void {
    this.loadReports();
    this.initializeCharts();
  }

  loadReports(): void {
    const period: ReportPeriod = {
      startDate: this.startDate,
      endDate: this.endDate,
    };

    this.dashboardReport$ = this.reportService.getDashboardReport(period);

    this.subscriptions.add(
      this.dashboardReport$.subscribe((report) => {
        this.revenueReport = report.revenueReport;
        this.topClients = report.topClients;
        this.popularServices = report.popularServices;
        this.popularPackages = report.popularPackages;
        this.occupancy = report.occupancy;
        this.updateCharts();
      }),
    );
  }

  onDateChange(): void {
    this.loadReports();
  }

  setQuickPeriod(period: 'week' | 'month' | 'quarter' | 'year'): void {
    const today = new Date();
    this.endDate = new Date();

    switch (period) {
      case 'week':
        this.startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        this.startDate = new Date(today.setMonth(today.getMonth() - 1));
        break;
      case 'quarter':
        this.startDate = new Date(today.setMonth(today.getMonth() - 3));
        break;
      case 'year':
        this.startDate = new Date(today.setFullYear(today.getFullYear() - 1));
        break;
    }

    this.loadReports();
  }

  private initializeCharts(): void {
    this.revenueChartOptions = {
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };
  }

  private updateCharts(): void {
    if (this.revenueReport) {
      this.revenueChartData = {
        labels: ['Omzet'],
        datasets: [
          {
            label: 'Totale Omzet',
            data: [this.revenueReport.totalRevenue],
            backgroundColor: ['rgba(75, 192, 192, 0.2)'],
            borderColor: ['rgb(75, 192, 192)'],
            borderWidth: 1,
          },
        ],
      };
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  exportToPDF(): void {
    // TODO: Implement PDF export functionality
    console.log('Export to PDF - To be implemented');
  }

  exportToExcel(): void {
    // TODO: Implement Excel export functionality
    console.log('Export to Excel - To be implemented');
  }
}
