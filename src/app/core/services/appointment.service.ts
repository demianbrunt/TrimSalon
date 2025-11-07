import { Injectable } from '@angular/core';
import { Appointment } from '../models/appointment.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService extends BaseService<Appointment> {
  constructor() {
    super('appointments');
  }
}
