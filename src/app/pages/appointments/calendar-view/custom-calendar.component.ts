import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SwipeDirective } from '../../../core/directives/swipe.directive';
import { Appointment } from '../../../core/models/appointment.model';

interface ViewOption {
  label: string;
  value: 'week' | 'day' | 'month';
  icon: string;
}

interface DayData {
  date: Date;
  dayNumber: number;
  isToday: boolean;
  isOtherMonth: boolean;
  appointments: Appointment[];
}

interface TimeSlot {
  hour: number;
  label: string;
}

@Component({
  selector: 'app-custom-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    BadgeModule,
    ButtonModule,
    CardModule,
    SelectButtonModule,
    SwipeDirective,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './custom-calendar.component.html',
  styleUrl: './custom-calendar.component.css',
})
export class CustomCalendarComponent implements AfterViewInit {
  // Inputs & Outputs
  appointments = input<Appointment[]>([]);
  appointmentClick = output<Appointment>();
  dateClick = output<{ date: Date; hour?: number }>();

  @ViewChild('calendarTable') calendarTable?: ElementRef;

  // Dependency injection
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals
  private appointmentsSignal = computed(() => this.appointments());

  viewMode = signal<'week' | 'day' | 'month'>('day');
  selectedDate = signal(new Date());

  viewModeOptions: ViewOption[] = [
    { label: 'Dag', value: 'day', icon: 'pi pi-sun' },
    { label: 'Week', value: 'week', icon: 'pi pi-calendar' },
    { label: 'Maand', value: 'month', icon: 'pi pi-table' },
  ];

  dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
  timeSlots: TimeSlot[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i.toString().padStart(2, '0')}:00`,
  }));

  constructor() {
    // Read query params on init - FIRST
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['view']) {
      this.viewMode.set(queryParams['view'] as 'week' | 'day' | 'month');
    }
    if (queryParams['date']) {
      const date = new Date(queryParams['date']);
      if (!isNaN(date.getTime())) {
        this.selectedDate.set(date);
      }
    }

    // Update query params when view or date changes
    effect(() => {
      const view = this.viewMode();
      const date = this.selectedDate();

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          view,
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        },
        queryParamsHandling: 'merge',
        replaceUrl: true, // Don't add to browser history
      });
    });
  }

  // Computed signals
  currentPeriodTitle = computed(() => {
    const date = this.selectedDate();
    const mode = this.viewMode();

    if (mode === 'day') {
      return date.toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else if (mode === 'week') {
      const weekStart = this.getWeekStart(date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `Week ${this.getWeekNumber(date)} - ${weekStart.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('nl-NL', {
        month: 'long',
        year: 'numeric',
      });
    }
  });

  weekDays = computed(() => {
    const date = this.selectedDate();
    const weekStart = this.getWeekStart(date);
    const days: DayData[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);

      days.push({
        date: dayDate,
        dayNumber: dayDate.getDate(),
        isToday: this.isToday(dayDate),
        isOtherMonth: false,
        appointments: this.getAppointmentsForDay(dayDate),
      });
    }

    return days;
  });

  monthWeeks = computed(() => {
    const date = this.selectedDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);

    // Start van de eerste week (maandag)
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(firstDay.getDate() + diff);

    const weeks: DayData[][] = [];
    const currentDate = new Date(startDate);

    // Genereer 6 weken
    for (let week = 0; week < 6; week++) {
      const weekDays: DayData[] = [];

      for (let day = 0; day < 7; day++) {
        weekDays.push({
          date: new Date(currentDate),
          dayNumber: currentDate.getDate(),
          isToday: this.isToday(currentDate),
          isOtherMonth: currentDate.getMonth() !== month,
          appointments: this.getAppointmentsForDay(currentDate),
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push(weekDays);
    }

    return weeks;
  });

  // Navigation methods
  previousPeriod(): void {
    const date = new Date(this.selectedDate());
    const mode = this.viewMode();

    if (mode === 'day') {
      date.setDate(date.getDate() - 1);
    } else if (mode === 'week') {
      date.setDate(date.getDate() - 7);
    } else {
      date.setMonth(date.getMonth() - 1);
    }

    this.selectedDate.set(date);
  }

  nextPeriod(): void {
    const date = new Date(this.selectedDate());
    const mode = this.viewMode();

    if (mode === 'day') {
      date.setDate(date.getDate() + 1);
    } else if (mode === 'week') {
      date.setDate(date.getDate() + 7);
    } else {
      date.setMonth(date.getMonth() + 1);
    }

    this.selectedDate.set(date);
  }

  goToToday(): void {
    this.selectedDate.set(new Date());
    setTimeout(() => this.scrollToCurrentTime(), 100);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.scrollToCurrentTime(), 300);
  }

  private scrollToCurrentTime(): void {
    const mode = this.viewMode();
    if (mode === 'month') return;

    const now = new Date();
    const currentHour = now.getHours();

    // Vind de rij die overeenkomt met het huidige uur
    const table = this.calendarTable?.nativeElement;
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const rowsArray = Array.from(rows) as Element[];
    const targetRow = rowsArray.find((row) => {
      const timeCell = row.querySelector('.time-cell');
      if (!timeCell) return false;
      const hourText = timeCell.textContent?.trim();
      const hour = parseInt(hourText?.split(':')[0] || '0');
      return hour === currentHour;
    });

    if (targetRow) {
      (targetRow as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  // Event handlers
  onCellClick(date: Date, hour?: number): void {
    this.dateClick.emit({ date, hour });
  }

  onAppointmentClick(event: Event, appointment: Appointment): void {
    event.stopPropagation();
    this.appointmentClick.emit(appointment);
  }

  // Helper methods
  getAppointmentsForDayHour(date: Date, hour: number): Appointment[] {
    return this.appointmentsSignal().filter((apt) => {
      if (!apt.startTime) return false;

      const aptDate = apt.startTime;
      const aptHour = aptDate.getHours();

      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear() &&
        aptHour === hour
      );
    });
  }

  getAppointmentsForDay(date: Date): Appointment[] {
    return this.appointmentsSignal().filter((apt) => {
      if (!apt.startTime) return false;

      const aptDate = apt.startTime;
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  isCurrentHour(hour: number): boolean {
    const now = new Date();
    const today = this.isToday(this.selectedDate());
    return today && now.getHours() === hour;
  }

  private getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Maandag als eerste dag
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
