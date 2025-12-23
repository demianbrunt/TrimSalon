import { Client } from './client.model';
import { Dog } from './dog.model';
import { Package } from './package.model';
import { Service } from './service.model';

export interface Appointment {
  id?: string;
  client: Client;
  dog: Dog;
  services?: Service[];
  packages?: Package[];
  startTime?: Date;
  endTime?: Date;
  notes?: string;
  // Estimated values (set when creating appointment)
  estimatedDuration?: number; // in minutes
  estimatedPrice?: number;
  // Actual values (set after appointment completion)
  actualServices?: Service[]; // Services actually performed
  actualPackages?: Package[]; // Packages actually performed
  actualEndTime?: Date; // Actual end time (can differ from estimated endTime)
  actualPrice?: number; // Final price charged (manual override)
  completed?: boolean; // Whether appointment has been completed
  // Google Calendar sync
  googleCalendarEventId?: string; // Google Calendar event ID for two-way sync
  lastModified?: Date; // Last modification timestamp for conflict resolution

  // Soft delete
  deletedAt?: Date;
}
