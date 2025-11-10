import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { Observable } from 'rxjs';
import { SubscriptionHolder } from '../../core/components/subscription-holder.component';
import {
  CalendarOccupancy,
  DashboardReport,
  ExpenseReport,
  PopularPackage,
  PopularService,
  ProfitLossReport,
  ReportPeriod,
  RevenueReport,
  TopClient,
} from '../../core/models/report.model';
import { ReportService } from '../../core/services/report.service';

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
  expenseReport?: ExpenseReport;
  profitLossReport?: ProfitLossReport;
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
        this.expenseReport = report.expenseReport;
        this.profitLossReport = report.profitLossReport;
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

  setQuickPeriod(period: 'week' | 'month' | 'quarter' | 'year' | 'all'): void {
    this.endDate = new Date();

    switch (period) {
      case 'week':
        this.startDate = new Date();
        this.startDate.setDate(this.startDate.getDate() - 7);
        break;
      case 'month':
        this.startDate = new Date();
        this.startDate.setMonth(this.startDate.getMonth() - 1);
        break;
      case 'quarter':
        this.startDate = new Date();
        this.startDate.setMonth(this.startDate.getMonth() - 3);
        break;
      case 'year':
        this.startDate = new Date();
        this.startDate.setFullYear(this.startDate.getFullYear() - 1);
        break;
      case 'all':
        // Set to a very early date to get all data
        this.startDate = new Date(2000, 0, 1);
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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.text('TrimSalon - Rapportage', pageWidth / 2, 15, { align: 'center' });

    // Period
    doc.setFontSize(12);
    const periodText = `Periode: ${this.startDate.toLocaleDateString('nl-NL')} - ${this.endDate.toLocaleDateString('nl-NL')}`;
    doc.text(periodText, pageWidth / 2, 25, { align: 'center' });

    let yPosition = 35;

    // Revenue Report
    if (this.revenueReport) {
      doc.setFontSize(14);
      doc.text('Omzet Overzicht', 14, yPosition);
      yPosition += 5;

      autoTable(doc, {
        startY: yPosition,
        head: [['Categorie', 'Bedrag']],
        body: [
          [
            'Totale Omzet',
            this.formatCurrency(this.revenueReport.totalRevenue),
          ],
          ['Aantal Afspraken', this.revenueReport.appointmentCount.toString()],
          [
            'Gemiddelde Omzet per Afspraak',
            this.formatCurrency(
              this.revenueReport.averageRevenuePerAppointment,
            ),
          ],
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Expense Report
    if (this.expenseReport) {
      doc.setFontSize(14);
      doc.text('Uitgaven Overzicht', 14, yPosition);
      yPosition += 5;

      autoTable(doc, {
        startY: yPosition,
        head: [['Categorie', 'Bedrag']],
        body: [
          [
            'Totale Uitgaven',
            this.formatCurrency(this.expenseReport.totalExpenses),
          ],
          ['Aantal Uitgaven', this.expenseReport.expenseCount.toString()],
          [
            'Gemiddelde Uitgave',
            this.formatCurrency(this.expenseReport.averageExpense),
          ],
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Profit/Loss Report
    if (this.profitLossReport) {
      doc.setFontSize(14);
      doc.text('Winst/Verlies Overzicht', 14, yPosition);
      yPosition += 5;

      const profitLossBody: any[][] = [
        [
          'Totale Omzet',
          this.formatCurrency(this.profitLossReport.totalRevenue),
        ],
        [
          'Totale Uitgaven',
          this.formatCurrency(this.profitLossReport.totalExpenses),
        ],
        [
          'Netto Winst/Verlies',
          this.formatCurrency(this.profitLossReport.netProfit),
        ],
        [
          'Winstmarge',
          this.formatPercentage(this.profitLossReport.profitMargin),
        ],
      ];

      if (this.profitLossReport.effectiveHourlyRate) {
        profitLossBody.push([
          'Effectief Uurtarief',
          this.formatCurrency(this.profitLossReport.effectiveHourlyRate),
        ]);
      }

      autoTable(doc, {
        startY: yPosition,
        head: [['Categorie', 'Bedrag']],
        body: profitLossBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Top Clients
    if (this.topClients && this.topClients.length > 0) {
      // Add new page if needed
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Top Klanten', 14, yPosition);
      yPosition += 5;

      autoTable(doc, {
        startY: yPosition,
        head: [['Klant', 'Aantal Afspraken', 'Totale Omzet']],
        body: this.topClients.map((client) => [
          client.clientName,
          client.appointmentCount.toString(),
          this.formatCurrency(client.totalRevenue),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Popular Services
    if (this.popularServices && this.popularServices.length > 0) {
      // Add new page if needed
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Populaire Diensten', 14, yPosition);
      yPosition += 5;

      autoTable(doc, {
        startY: yPosition,
        head: [['Dienst', 'Aantal Keer Gebruikt', 'Totale Omzet']],
        body: this.popularServices.map((service) => [
          service.serviceName,
          service.usageCount.toString(),
          this.formatCurrency(service.totalRevenue),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Popular Packages
    if (this.popularPackages && this.popularPackages.length > 0) {
      // Add new page if needed
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Populaire Pakketten', 14, yPosition);
      yPosition += 5;

      autoTable(doc, {
        startY: yPosition,
        head: [['Pakket', 'Aantal Keer Gebruikt', 'Totale Omzet']],
        body: this.popularPackages.map((pkg) => [
          pkg.packageName,
          pkg.usageCount.toString(),
          this.formatCurrency(pkg.totalRevenue),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Occupancy
    if (this.occupancy) {
      // Add new page if needed
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Agenda Bezetting', 14, yPosition);
      yPosition += 5;

      autoTable(doc, {
        startY: yPosition,
        head: [['Categorie', 'Waarde']],
        body: [
          [
            'Totaal Beschikbare Uren',
            this.occupancy.totalAvailableHours.toFixed(1),
          ],
          ['Totaal Geboekte Uren', this.occupancy.totalBookedHours.toFixed(1)],
          [
            'Bezettingsgraad',
            this.formatPercentage(this.occupancy.occupancyRate),
          ],
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });
    }

    // Save the PDF
    const fileName = `TrimSalon_Rapport_${this.startDate.toLocaleDateString('nl-NL').replace(/\//g, '-')}_${this.endDate.toLocaleDateString('nl-NL').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  }

  exportToExcel(): void {
    // TODO: Implement Excel export functionality
    console.log('Export to Excel - To be implemented');
  }
}
