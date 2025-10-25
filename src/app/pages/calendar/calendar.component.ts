import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CalendarModule as AngularCalendarModule,
  CalendarEvent,
  CalendarView,
} from 'angular-calendar';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Appointment } from '../../core/models/appointment.model';
import { GoogleCalendar } from '../../core/models/calendar.model';
import { CalendarService } from '../../core/services/calendar.service';

import { addDays, addMonths, addWeeks } from 'date-fns';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    AngularCalendarModule,
    ReactiveFormsModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    TextareaModule,
    SelectButtonModule,
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit {
  private readonly calendarService = inject(CalendarService);
  private readonly fb = inject(FormBuilder);

  view = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate = new Date();
  today = new Date();
  events: CalendarEvent[] = [];
  appointments: Appointment[] = [];
  appointmentForm: FormGroup;
  displayAppointmentDialog = false;
  activeAppointment: Appointment | null = null;
  calendars: GoogleCalendar[] = [];
  selectedCalendarId: string;
  locale = 'nl';

  async ngOnInit(): Promise<void> {
    this.appointmentForm = this.fb.group({
      id: [null],
      summary: ['', Validators.required],
      dogId: ['', Validators.required],
      start: this.fb.group({
        dateTime: ['', Validators.required],
        timeZone: [''],
      }),
      end: this.fb.group({
        dateTime: ['', Validators.required],
        timeZone: [''],
      }),
      description: [''],
    });

    this.selectedCalendarId =
      await this.calendarService.ensureTrimSalonCalendar();
    this.calendarService.listCalendars().subscribe((calendars) => {
      this.calendars = calendars.items;
      this.onCalendarChange();
    });
  }

  onCalendarChange(): void {
    this.calendarService
      .getAppointments(this.selectedCalendarId)
      .subscribe((appointments) => {
        this.appointments = appointments;
        this.events = appointments.map((appointment) => {
          return {
            id: appointment.id,
            start: new Date(appointment.start.dateTime),
            end: new Date(appointment.end.dateTime),
            title: appointment.summary,
          };
        });
      });
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  getPreviousViewDate(): Date {
    if (this.view === CalendarView.Month) {
      return addMonths(this.viewDate, -1);
    } else if (this.view === CalendarView.Week) {
      return addWeeks(this.viewDate, -1);
    } else {
      return addDays(this.viewDate, -1);
    }
  }

  getNextViewDate(): Date {
    if (this.view === CalendarView.Month) {
      return addMonths(this.viewDate, 1);
    } else if (this.view === CalendarView.Week) {
      return addWeeks(this.viewDate, 1);
    } else {
      return addDays(this.viewDate, 1);
    }
  }

  dayClicked({ date }: { date: Date }): void {
    this.appointmentForm.reset();
    this.appointmentForm.patchValue({
      start: { dateTime: date.toISOString() },
      end: { dateTime: date.toISOString() },
    });
    this.displayAppointmentDialog = true;
  }

  eventClicked({ event }: { event: CalendarEvent }): void {
    const clickedAppointment = this.appointments.find(
      (appointment) => appointment.id === event.id,
    );
    if (clickedAppointment) {
      this.activeAppointment = clickedAppointment;
      this.appointmentForm.patchValue({
        ...clickedAppointment,
        start: { dateTime: clickedAppointment.start.dateTime },
        end: { dateTime: clickedAppointment.end.dateTime },
      });
      this.displayAppointmentDialog = true;
    }
  }

  showAddAppointmentDialog(): void {
    this.activeAppointment = null;
    this.appointmentForm.reset();
    this.displayAppointmentDialog = true;
  }

  hideAppointmentDialog(): void {
    this.displayAppointmentDialog = false;
  }

  saveAppointment(): void {
    if (this.appointmentForm.valid) {
      const formValues = this.appointmentForm.value;
      const appointment: Appointment = {
        ...this.activeAppointment,
        ...formValues,
        description: `--- Aangemaakt door TrimSalon ---\n\nNotities: ${formValues.description}\n\nLink: https://trimsalon-9b823.web.app/`,
        start: {
          ...formValues.start,
          timeZone: 'America/New_York', // Or get from user settings
        },
        end: {
          ...formValues.end,
          timeZone: 'America/New_York', // Or get from user settings
        },
      };

      if (appointment.id) {
        this.calendarService
          .updateAppointment(this.selectedCalendarId, appointment)
          .subscribe((updatedAppointment) => {
            const index = this.appointments.findIndex(
              (a) => a.id === updatedAppointment.id,
            );
            if (index > -1) {
              this.appointments[index] = updatedAppointment;
              this.events[index] = {
                id: updatedAppointment.id,
                start: new Date(updatedAppointment.start.dateTime),
                end: new Date(updatedAppointment.end.dateTime),
                title: updatedAppointment.summary,
              };
              this.events = [...this.events];
            }
            this.hideAppointmentDialog();
          });
      } else {
        this.calendarService
          .addAppointment(this.selectedCalendarId, appointment)
          .subscribe((newAppointment) => {
            this.appointments.push(newAppointment);
            this.events = [
              ...this.events,
              {
                id: newAppointment.id,
                start: new Date(newAppointment.start.dateTime),
                end: new Date(newAppointment.end.dateTime),
                title: newAppointment.summary,
              },
            ];
            this.hideAppointmentDialog();
          });
      }
    }
  }
}
