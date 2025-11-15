import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Calendar, CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import nlLocale from '@fullcalendar/core/locales/nl';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Appointment } from '../../../core/models/appointment.model';
import { MobileService } from '../../../core/services/mobile.service';

interface ViewOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectButtonModule],
  templateUrl: './calendar-view.html',
  styleUrl: './calendar-view.css',
})
export class CalendarView implements AfterViewInit, OnChanges {
  @Input() appointments: Appointment[] = [];
  @Output() appointmentClick = new EventEmitter<Appointment>();
  @Output() dateClick = new EventEmitter<Date>();

  @ViewChild('calendarEl', { static: false }) calendarEl!: ElementRef;

  private readonly router = inject(Router);
  private readonly mobileService = inject(MobileService);
  private calendar: Calendar | null = null;

  viewOptions: ViewOption[] = [
    { label: 'Dag', value: 'timeGridDay' },
    { label: 'Week', value: 'timeGridWeek' },
    { label: 'Maand', value: 'dayGridMonth' },
    { label: 'Lijst', value: 'listWeek' },
  ];

  selectedView = 'timeGridWeek';

  get isMobile(): boolean {
    return this.mobileService.isMobile;
  }

  ngAfterViewInit(): void {
    this.initializeCalendar();
  }

  ngOnChanges(): void {
    if (this.calendar) {
      this.updateEvents();
    }
  }

  private initializeCalendar(): void {
    if (!this.calendarEl) return;

    const calendarOptions: CalendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
      initialView: this.isMobile ? 'listWeek' : 'timeGridWeek',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: this.isMobile
          ? ''
          : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
      },
      locale: nlLocale,
      weekends: true,
      editable: false,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      slotMinTime: '08:00:00',
      slotMaxTime: '20:00:00',
      height: this.isMobile ? 'auto' : '650px',
      eventClick: this.handleEventClick.bind(this),
      dateClick: this.handleDateClick.bind(this),
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      },
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      },
    };

    this.calendar = new Calendar(
      this.calendarEl.nativeElement,
      calendarOptions,
    );
    this.calendar.render();
    this.updateEvents();
  }

  private updateEvents(): void {
    if (!this.calendar) return;

    const events = this.appointments.map((appointment) => ({
      id: appointment.id,
      title: `${appointment.client.name} - ${appointment.dog.name}`,
      start: appointment.startTime,
      end: appointment.endTime,
      backgroundColor: appointment.completed ? '#22c55e' : '#3b82f6',
      borderColor: appointment.completed ? '#16a34a' : '#2563eb',
      extendedProps: {
        appointment,
      },
    }));

    // Remove all existing events
    const existingEvents = this.calendar.getEvents();
    existingEvents.forEach((event) => event.remove());

    // Add new events
    events.forEach((event) => this.calendar!.addEvent(event));
  }

  handleEventClick(arg: EventClickArg): void {
    const appointment = arg.event.extendedProps['appointment'] as Appointment;
    if (appointment) {
      this.appointmentClick.emit(appointment);
    }
  }

  handleDateClick(arg: { date: Date }): void {
    this.dateClick.emit(arg.date);
  }

  onViewChange(viewType: string): void {
    this.selectedView = viewType;
    if (this.calendar) {
      this.calendar.changeView(viewType);
    }
  }
}
