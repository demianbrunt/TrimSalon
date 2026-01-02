import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { jsPDF as JsPDF } from 'jspdf';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { SubscriptionHolder } from '../../core/components/subscription-holder.component';
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
    SelectButtonModule,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent extends SubscriptionHolder implements OnInit {
  private reportService = inject(ReportService);

  private readonly autoTablePaddingAfterSection = 10;

  startDate: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  endDate: Date = new Date();

  rangeDates: Date[] | undefined = [
    new Date(this.startDate),
    new Date(this.endDate),
  ];

  selectedPeriod: 'week' | 'month' | 'quarter' | 'year' | 'all' | null =
    'month';

  periodOptions = [
    { label: 'Week', value: 'week' },
    { label: 'Maand', value: 'month' },
    { label: 'Kwartaal', value: 'quarter' },
    { label: 'Jaar', value: 'year' },
    { label: 'Alles', value: 'all' },
  ];

  private period$ = new BehaviorSubject<ReportPeriod>({
    startDate: this.startDate,
    endDate: this.endDate,
  });

  dashboardReport$?: Observable<DashboardReport>;
  revenueReport?: RevenueReport;
  expenseReport?: ExpenseReport;
  profitLossReport?: ProfitLossReport;
  topClients?: TopClient[];
  popularServices?: PopularService[];
  popularPackages?: PopularPackage[];
  occupancy?: CalendarOccupancy;
  hourlyRateKPI?: HourlyRateKPI;
  breedPerformance?: BreedPerformance[];

  revenueChartData: unknown;
  revenueChartOptions: unknown;

  ngOnInit(): void {
    this.initializeCharts();

    this.rangeDates = [new Date(this.startDate), new Date(this.endDate)];

    this.dashboardReport$ = this.period$.pipe(
      switchMap((period) => this.reportService.getDashboardReport(period)),
    );

    this.subscriptions.add(
      this.dashboardReport$.subscribe((report) => {
        this.revenueReport = report.revenueReport;
        this.expenseReport = report.expenseReport;
        this.profitLossReport = report.profitLossReport;
        this.topClients = report.topClients;
        this.popularServices = report.popularServices;
        this.popularPackages = report.popularPackages;
        this.occupancy = report.occupancy;
        this.hourlyRateKPI = report.hourlyRateKPI;
        this.breedPerformance = report.breedPerformance;
        this.updateCharts();
      }),
    );
  }

  loadReports(): void {
    this.period$.next({
      startDate: this.startDate,
      endDate: this.endDate,
    });
  }

  onDateChange(): void {
    this.selectedPeriod = null; // Clear selection when custom date is picked

    const start = this.rangeDates?.[0];
    const end = this.rangeDates?.[1];
    if (!start || !end) {
      return;
    }

    const newStartDate = new Date(start);
    newStartDate.setHours(0, 0, 0, 0);

    const newEndDate = new Date(end);
    newEndDate.setHours(23, 59, 59, 999);

    this.startDate = newStartDate;
    this.endDate = newEndDate;
    this.rangeDates = [new Date(this.startDate), new Date(this.endDate)];

    this.loadReports();
  }

  setQuickPeriod(period: 'week' | 'month' | 'quarter' | 'year' | 'all'): void {
    this.selectedPeriod = period;
    const now = new Date();

    // Set end date to end of today
    const newEndDate = new Date(now);
    newEndDate.setHours(23, 59, 59, 999);

    let newStartDate = new Date(now);
    newStartDate.setHours(0, 0, 0, 0);

    switch (period) {
      case 'week': {
        // Start of current week (Monday)
        const day = newStartDate.getDay();
        const diff = newStartDate.getDate() - day + (day === 0 ? -6 : 1);
        newStartDate.setDate(diff);
        break;
      }
      case 'month':
        // Start of current month
        newStartDate.setDate(1);
        break;
      case 'quarter': {
        // Start of current quarter
        const currentMonth = newStartDate.getMonth();
        const startMonth = currentMonth - (currentMonth % 3);
        newStartDate.setMonth(startMonth, 1);
        break;
      }
      case 'year':
        // Start of current year
        newStartDate.setMonth(0, 1);
        break;
      case 'all':
        // Set to a very early date to get all data
        newStartDate = new Date(2000, 0, 1);
        break;
    }

    this.startDate = newStartDate;
    this.endDate = newEndDate;
    this.rangeDates = [new Date(this.startDate), new Date(this.endDate)];

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

  exportToExcel(): void {
    if (!this.revenueReport || !this.expenseReport || !this.profitLossReport) {
      return;
    }

    const rows = [
      ['Rapportage TrimSalon'],
      [
        `Periode: ${this.startDate.toLocaleDateString('nl-NL')} - ${this.endDate.toLocaleDateString('nl-NL')}`,
      ],
      [],
      ['Omzet Overzicht'],
      ['Categorie', 'Bedrag'],
      ['Totale Omzet', this.revenueReport.totalRevenue],
      ['Aantal Afspraken', this.revenueReport.appointmentCount],
      [
        'Gemiddelde Omzet per Afspraak',
        this.revenueReport.averageRevenuePerAppointment,
      ],
      [],
      ['Uitgaven Overzicht'],
      ['Categorie', 'Bedrag'],
      ['Totale Uitgaven', this.expenseReport.totalExpenses],
      ['Aantal Uitgaven', this.expenseReport.expenseCount],
      ['Gemiddelde Uitgave', this.expenseReport.averageExpense],
      [],
      ['Winst/Verlies Overzicht'],
      ['Categorie', 'Bedrag'],
      ['Totale Omzet', this.profitLossReport.totalRevenue],
      ['Totale Uitgaven', this.profitLossReport.totalExpenses],
      ['Netto Winst/Verlies', this.profitLossReport.netProfit],
      ['Winstmarge', `${this.profitLossReport.profitMargin}%`],
    ];

    if (this.profitLossReport.effectiveHourlyRate) {
      rows.push([
        'Effectief Uurtarief',
        this.profitLossReport.effectiveHourlyRate,
      ]);
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    rows.forEach((rowArray) => {
      const row = rowArray.join(';');
      csvContent += row + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rapportage_${this.startDate.toISOString().split('T')[0]}_${this.endDate.toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async exportToPDF(): Promise<void> {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc = new jsPDF() as JsPDF & {
      lastAutoTable?: {
        finalY: number;
      };
    };
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

      yPosition =
        (doc.lastAutoTable?.finalY ?? yPosition) +
        this.autoTablePaddingAfterSection;
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

      yPosition =
        (doc.lastAutoTable?.finalY ?? yPosition) +
        this.autoTablePaddingAfterSection;
    }

    // Profit/Loss Report
    if (this.profitLossReport) {
      doc.setFontSize(14);
      doc.text('Winst/Verlies Overzicht', 14, yPosition);
      yPosition += 5;

      const profitLossBody: [string, string][] = [
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

      yPosition =
        (doc.lastAutoTable?.finalY ?? yPosition) +
        this.autoTablePaddingAfterSection;
    }

    // Top Clients
    if (this.topClients && this.topClients.length > 0) {
      doc.setFontSize(14);
      doc.text('Top Klanten', 14, yPosition);
      yPosition += 5;

      autoTable(doc, {
        startY: yPosition,
        head: [['Klant', 'Afspraken', 'Omzet']],
        body: this.topClients.map((client) => [
          client.clientName,
          client.appointmentCount.toString(),
          this.formatCurrency(client.totalRevenue),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPosition =
        (doc.lastAutoTable?.finalY ?? yPosition) +
        this.autoTablePaddingAfterSection;
    }

    doc.save('rapportage.pdf');
  }
}
