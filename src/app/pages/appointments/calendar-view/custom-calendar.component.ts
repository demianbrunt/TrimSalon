import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SwipeDirective } from '../../../core/directives/swipe.directive';
import { Appointment } from '../../../core/models/appointment.model';
import { MobileService } from '../../../core/services/mobile.service';

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
  slotIndex: number;
  hour: number;
  minute: number;
  label: string;
}

interface SpanningAppointmentCell {
  appointment: Appointment;
  rowSpan: number;
}

interface SlotPosition {
  topPct: number;
  heightPct: number;
}

@Component({
  selector: 'app-custom-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    BadgeModule,
    ButtonModule,
    CardModule,
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
  dateClick = output<{ date: Date; hour?: number; minute?: number }>();

  @ViewChild('calendarTable') calendarTable?: ElementRef;
  @ViewChild('calendarHeader', { read: ElementRef })
  calendarHeader?: ElementRef<HTMLElement>;

  // Dependency injection
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private mobileService = inject(MobileService);
  private destroyRef = inject(DestroyRef);
  private hostElementRef = inject(ElementRef<HTMLElement>);

  private headerResizeObserver: ResizeObserver | null = null;

  private longPressTimerId: number | null = null;
  private longPressStartPoint: { x: number; y: number } | null = null;
  private suppressNextAppointmentClick = false;

  // Signals
  private appointmentsSignal = computed(() => this.appointments());

  private readonly slotMinutes = 60;
  private readonly slotsPerDay = (24 * 60) / this.slotMinutes;

  viewMode = signal<'week' | 'day' | 'month'>('day');
  selectedDate = signal(new Date());
  currentTime = signal(new Date()); // Signal for current time updates

  swipeTransition = signal<'left' | 'right' | null>(null);
  swipeIndicator = signal<'left' | 'right' | null>(null);

  swipeIndicatorLabel = computed(() => {
    const direction = this.swipeIndicator();
    if (!direction) return '';

    const mode = this.viewMode();
    const isNext = direction === 'left';

    if (mode === 'day') {
      return isNext ? 'Volgende dag' : 'Vorige dag';
    }

    if (mode === 'week') {
      return isNext ? 'Volgende week' : 'Vorige week';
    }

    return isNext ? 'Volgende maand' : 'Vorige maand';
  });

  // Optimized Appointment Map for O(1) lookup
  private appointmentsMap = computed(() => {
    const map = new Map<string, Appointment[]>();
    const appointments = this.appointmentsSignal();

    appointments.forEach((apt) => {
      if (!apt.startTime) return;
      const date = apt.startTime;
      const slotIndex = this.getSlotIndex(date);
      // Key format: YYYY-M-D-slotIndex (using simple values to avoid padding overhead)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${slotIndex}`;

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(apt);
    });
    return map;
  });

  viewModeOptions: ViewOption[] = [
    { label: 'Dag', value: 'day', icon: 'pi pi-sun' },
    { label: 'Week', value: 'week', icon: 'pi pi-calendar' },
    { label: 'Maand', value: 'month', icon: 'pi pi-table' },
  ];

  dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
  timeSlots: TimeSlot[] = Array.from({ length: this.slotsPerDay }, (_, i) => {
    const hour = i;
    return {
      slotIndex: i,
      hour,
      minute: 0,
      label: `${hour.toString().padStart(2, '0')}:00`,
    };
  });

  getBreedLabel(apt: Appointment): string {
    return apt.dog?.breed?.name || 'Onbekend';
  }

  getGenderLabel(apt: Appointment): { icon: string; text: string } | null {
    const gender = apt.dog?.gender;
    if (gender === 'male') {
      return { icon: 'pi pi-mars text-blue-600', text: 'Reu' };
    }
    if (gender === 'female') {
      return { icon: 'pi pi-venus text-pink-600', text: 'Teefje' };
    }
    return null;
  }

  getAgeLabel(apt: Appointment): string | null {
    const age = apt.dog?.age;
    if (age === null || age === undefined) {
      return null;
    }
    return `${age} jr`;
  }

  getServiceNames(apt: Appointment): string | null {
    if (!apt.services?.length) return null;
    return apt.services.map((s) => s.name).join(', ');
  }

  getPackageNames(apt: Appointment): string | null {
    if (!apt.packages?.length) return null;
    return apt.packages.map((p) => p.name).join(', ');
  }

  hasNotes(apt: Appointment): boolean {
    return !!apt.notes && apt.notes.trim().length > 0;
  }

  get isMobile() {
    return this.mobileService.isMobile;
  }

  constructor() {
    // Update current time every minute
    setInterval(() => {
      this.currentTime.set(new Date());
    }, 60000);

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
  currentPeriodMainTitle = computed(() => {
    const date = this.selectedDate();
    const mode = this.viewMode();

    if (mode === 'day') {
      const dayName = date.toLocaleDateString('nl-NL', { weekday: 'long' });
      return dayName.charAt(0).toUpperCase() + dayName.slice(1);
    } else if (mode === 'week') {
      return `Week ${this.getWeekNumber(date)}`;
    } else {
      const monthName = date.toLocaleDateString('nl-NL', { month: 'long' });
      return monthName.charAt(0).toUpperCase() + monthName.slice(1);
    }
  });

  currentPeriodSubTitle = computed(() => {
    const date = this.selectedDate();
    const mode = this.viewMode();

    if (mode === 'day') {
      return date.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else if (mode === 'week') {
      const weekStart = this.getWeekStart(date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startDay = weekStart.getDate();
      const endDay = weekEnd.getDate();
      const monthName = weekStart.toLocaleDateString('nl-NL', {
        month: 'long',
      });
      const year = weekStart.getFullYear();

      return `${startDay} - ${endDay} ${monthName} ${year}`;
    } else {
      return date.getFullYear().toString();
    }
  });

  // Keep for backwards compatibility
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

  isCurrentPeriodToday = computed(() => {
    const date = this.selectedDate();
    const mode = this.viewMode();
    const today = new Date();

    if (mode === 'day') {
      return this.isToday(date);
    } else if (mode === 'week') {
      const weekStart = this.getWeekStart(date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Check if today is within this week
      return today >= weekStart && today <= weekEnd;
    } else {
      // Check if today is in this month
      return (
        today.getMonth() === date.getMonth() &&
        today.getFullYear() === date.getFullYear()
      );
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

  handleSwipe(direction: 'left' | 'right'): void {
    this.swipeTransition.set(direction);
    this.swipeIndicator.set(direction);

    if (direction === 'left') {
      this.nextPeriod();
    } else {
      this.previousPeriod();
    }

    window.setTimeout(() => this.swipeTransition.set(null), 220);
    window.setTimeout(() => this.swipeIndicator.set(null), 800);
  }

  goToToday(): void {
    this.selectedDate.set(new Date());
    setTimeout(() => this.scrollToCurrentTime(), 100);
  }

  setViewMode(mode: 'week' | 'day' | 'month'): void {
    if (this.viewMode() === mode) {
      return;
    }

    this.viewMode.set(mode);

    if (mode !== 'month') {
      setTimeout(() => this.scrollToCurrentTime(), 100);
    }
  }

  ngAfterViewInit(): void {
    this.updateStickyOffsets();

    const headerEl = this.calendarHeader?.nativeElement;
    if (headerEl && typeof ResizeObserver !== 'undefined') {
      this.headerResizeObserver = new ResizeObserver(() => {
        this.updateStickyOffsets();
      });
      this.headerResizeObserver.observe(headerEl);
      this.destroyRef.onDestroy(() => this.headerResizeObserver?.disconnect());
    }

    setTimeout(() => this.scrollToCurrentTime(), 300);
  }

  private updateStickyOffsets(): void {
    const headerEl = this.calendarHeader?.nativeElement;
    if (!headerEl) return;

    const height = Math.ceil(headerEl.getBoundingClientRect().height);
    this.hostElementRef.nativeElement.style.setProperty(
      '--calendar-controls-sticky-height',
      `${height}px`,
    );
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
      const timeCell = row.querySelector('.time-col');
      if (!timeCell) return false;
      const hourText = timeCell.textContent?.trim();
      const hour = parseInt(hourText?.split(':')[0] || '0');
      return hour === currentHour;
    });

    if (targetRow) {
      (targetRow as HTMLElement).scrollIntoView({
        behavior: this.prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'center',
      });
    }
  }

  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private openGoogleCalendarForAppointment(appointment: Appointment): void {
    if (typeof window === 'undefined') {
      return;
    }

    const eventId = appointment.googleCalendarEventId;

    // Best-effort: open the event editor when we have an event id.
    // If not, fall back to opening the day view.
    const start = appointment.startTime ?? this.selectedDate();

    const url = eventId
      ? `https://calendar.google.com/calendar/u/0/r/eventedit/${encodeURIComponent(eventId)}`
      : `https://calendar.google.com/calendar/u/0/r/day/${start.getFullYear()}/${start.getMonth() + 1}/${start.getDate()}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  onAppointmentPointerDown(
    event: PointerEvent,
    appointment: Appointment,
  ): void {
    // Only treat touch/pen as long-press candidates.
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
      return;
    }

    this.clearLongPress();
    this.longPressStartPoint = { x: event.clientX, y: event.clientY };

    this.longPressTimerId = window.setTimeout(() => {
      this.suppressNextAppointmentClick = true;
      this.openGoogleCalendarForAppointment(appointment);
      this.clearLongPress();
    }, 450);
  }

  onAppointmentPointerMove(event: PointerEvent): void {
    if (!this.longPressStartPoint) {
      return;
    }

    const dx = Math.abs(event.clientX - this.longPressStartPoint.x);
    const dy = Math.abs(event.clientY - this.longPressStartPoint.y);
    if (dx > 10 || dy > 10) {
      this.clearLongPress();
    }
  }

  onAppointmentPointerUp(): void {
    this.clearLongPress();
  }

  onAppointmentPointerCancel(): void {
    this.clearLongPress();
  }

  private clearLongPress(): void {
    if (this.longPressTimerId !== null) {
      window.clearTimeout(this.longPressTimerId);
      this.longPressTimerId = null;
    }
    this.longPressStartPoint = null;
  }

  // Event handlers
  onCellClick(date: Date, slot?: TimeSlot): void {
    if (!slot) {
      this.dateClick.emit({ date });
      return;
    }

    this.dateClick.emit({ date, hour: slot.hour, minute: slot.minute });
  }

  onAppointmentClick(event: Event, appointment: Appointment): void {
    if (this.suppressNextAppointmentClick) {
      this.suppressNextAppointmentClick = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    this.appointmentClick.emit(appointment);
  }

  onAppointmentContextMenu(event: MouseEvent, appointment: Appointment): void {
    event.preventDefault();
    event.stopPropagation();
    this.openGoogleCalendarForAppointment(appointment);
  }

  getSpanningAppointmentForCell(
    date: Date,
    slotIndex: number,
  ): SpanningAppointmentCell | null {
    const dayAppointments = this.getAppointmentsForDay(date).filter(
      (apt) => !!apt.startTime,
    );

    const startingThisSlot = dayAppointments.filter((apt) => {
      const start = apt.startTime;
      if (!start) return false;
      return this.getSlotIndex(start) === slotIndex;
    });

    // If multiple appointments start in the same slot, we can't safely use a rowspan.
    if (startingThisSlot.length !== 1) {
      return null;
    }

    const appointment = startingThisSlot[0]!;
    const rowSpan = this.getRowSpanSlots(appointment);
    if (rowSpan <= 1) {
      return null;
    }

    if (!this.canRenderAsRowSpan(appointment, dayAppointments)) {
      return null;
    }

    return { appointment, rowSpan };
  }

  isSlotCoveredBySpanningAppointment(date: Date, slotIndex: number): boolean {
    const dayAppointments = this.getAppointmentsForDay(date).filter(
      (apt) => !!apt.startTime,
    );

    return dayAppointments.some((apt) => {
      const start = apt.startTime;
      if (!start) return false;

      const rowSpan = this.getRowSpanSlots(apt);
      if (rowSpan <= 1) return false;
      if (!this.canRenderAsRowSpan(apt, dayAppointments)) return false;

      const startSlot = this.getSlotIndex(start);
      return slotIndex > startSlot && slotIndex < startSlot + rowSpan;
    });
  }

  // Helper methods
  getAppointmentsForDaySlot(date: Date, slotIndex: number): Appointment[] {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${slotIndex}`;
    return this.appointmentsMap().get(key) || [];
  }

  private getRowSpanSlots(apt: Appointment): number {
    const start = apt.startTime;
    if (!start) return 1;

    const end = this.getEffectiveEndTime(apt);
    if (!end) return 1;

    if (end.getTime() <= start.getTime()) {
      return 1;
    }

    const dayEnd = new Date(start);
    dayEnd.setHours(24, 0, 0, 0);
    const effectiveEnd = end.getTime() > dayEnd.getTime() ? dayEnd : end;

    const startOffsetMinutes = start.getMinutes();
    const ms = effectiveEnd.getTime() - start.getTime();
    const durationMinutes = ms / 60000;
    const slots = Math.ceil(
      (startOffsetMinutes + durationMinutes) / this.slotMinutes,
    );

    const startSlot = this.getSlotIndex(start);
    const remainingSlots = this.slotsPerDay - startSlot;

    return Math.min(remainingSlots, Math.max(1, slots));
  }

  private getSlotPositionWithinSpan(
    apt: Appointment,
    spanStartSlot: number,
    rowSpan: number,
  ): SlotPosition {
    const start = apt.startTime;
    if (!start) return { topPct: 0, heightPct: 100 };

    const end = this.getEffectiveEndTime(apt);
    if (!end) return { topPct: 0, heightPct: 100 };

    const spanStart = new Date(start);
    spanStart.setHours(spanStartSlot, 0, 0, 0);

    const dayEnd = new Date(start);
    dayEnd.setHours(24, 0, 0, 0);
    const effectiveEnd = end.getTime() > dayEnd.getTime() ? dayEnd : end;

    const totalSpanMinutes = rowSpan * this.slotMinutes;
    const topMinutes = Math.max(
      0,
      Math.min(
        totalSpanMinutes,
        (start.getTime() - spanStart.getTime()) / 60000,
      ),
    );
    const durationMinutes = Math.max(
      0,
      Math.min(
        totalSpanMinutes - topMinutes,
        (effectiveEnd.getTime() - start.getTime()) / 60000,
      ),
    );

    return {
      topPct: (topMinutes / totalSpanMinutes) * 100,
      heightPct: (durationMinutes / totalSpanMinutes) * 100,
    };
  }

  getAppointmentTopPctInSpan(
    apt: Appointment,
    spanStartSlot: number,
    rowSpan: number,
  ): number {
    return this.getSlotPositionWithinSpan(apt, spanStartSlot, rowSpan).topPct;
  }

  getAppointmentHeightPctInSpan(
    apt: Appointment,
    spanStartSlot: number,
    rowSpan: number,
  ): number {
    return this.getSlotPositionWithinSpan(apt, spanStartSlot, rowSpan)
      .heightPct;
  }

  getAppointmentTopPctInHour(apt: Appointment): number {
    const start = apt.startTime;
    if (!start) return 0;
    return (start.getMinutes() / 60) * 100;
  }

  getAppointmentHeightPctInHour(apt: Appointment): number {
    const start = apt.startTime;
    if (!start) return 100;
    const end = this.getEffectiveEndTime(apt);
    if (!end) return 100;

    const endClamped = new Date(end);
    endClamped.setSeconds(0, 0);

    const durationMinutes = Math.max(
      0,
      (endClamped.getTime() - start.getTime()) / 60000,
    );
    return (Math.min(60, durationMinutes) / 60) * 100;
  }

  isCurrentTimeWithinSpan(spanStartSlot: number, rowSpan: number): boolean {
    const nowSlot = this.getSlotIndex(this.currentTime());
    return nowSlot >= spanStartSlot && nowSlot < spanStartSlot + rowSpan;
  }

  getCurrentTimeOffsetPercentageWithinSpan(
    spanStartSlot: number,
    rowSpan: number,
  ): number {
    const now = this.currentTime();
    const nowSlot = this.getSlotIndex(now);
    const minutesFromSpanStart =
      (nowSlot - spanStartSlot) * this.slotMinutes + now.getMinutes();
    const total = rowSpan * this.slotMinutes;
    return (minutesFromSpanStart / total) * 100;
  }

  private getSlotIndex(date: Date): number {
    const totalMinutes = date.getHours() * 60 + date.getMinutes();
    return Math.max(
      0,
      Math.min(
        this.slotsPerDay - 1,
        Math.floor(totalMinutes / this.slotMinutes),
      ),
    );
  }

  private getEffectiveEndTime(apt: Appointment): Date | null {
    if (apt.endTime) {
      return apt.endTime;
    }

    if (apt.startTime && typeof apt.estimatedDuration === 'number') {
      return new Date(apt.startTime.getTime() + apt.estimatedDuration * 60000);
    }

    return null;
  }

  private canRenderAsRowSpan(
    target: Appointment,
    dayAppointments: Appointment[],
  ): boolean {
    const start = target.startTime;
    if (!start) return false;

    const end = this.getEffectiveEndTime(target);
    if (!end) return false;

    // If anything overlaps this time range, rowspanning would hide cells
    // and would also hide other appointments.
    return !dayAppointments.some((other) => {
      if (other === target) return false;
      const otherStart = other.startTime;
      if (!otherStart) return false;

      const otherEnd = this.getEffectiveEndTime(other) ?? otherStart;
      return (
        otherStart.getTime() < end.getTime() &&
        otherEnd.getTime() > start.getTime()
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

  isCurrentSlot(slotIndex: number): boolean {
    const now = this.currentTime();
    const nowSlot = this.getSlotIndex(now);

    // Check if ANY day in the current view is today
    if (this.viewMode() === 'week') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isAnyDayToday = this.weekDays().some((day) => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === today.getTime();
      });

      return isAnyDayToday && nowSlot === slotIndex;
    }
    // For day view, check if selected date is today
    const today = this.isToday(this.selectedDate());
    return today && nowSlot === slotIndex;
  }

  getCurrentSlotMinutePercentage(): number {
    const minutes = this.currentTime().getMinutes();
    return ((minutes % this.slotMinutes) / this.slotMinutes) * 100;
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
