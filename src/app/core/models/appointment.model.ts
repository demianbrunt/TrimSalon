import { Client } from './client.model';
import { Dog } from './dog.model';
import { Package } from './package.model';
import { Service } from './service.model';

/**
 * Activity types for time logging during appointments.
 */
export type ActivityType =
  | 'WASHING'
  | 'DRYING'
  | 'CUTTING'
  | 'NAILS'
  | 'EARS'
  | 'OTHER'
  | 'BREAK';

/**
 * Activity labels for display in UI.
 */
export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  WASHING: 'Wassen',
  DRYING: 'Drogen',
  CUTTING: 'Knippen',
  NAILS: 'Nagels',
  EARS: 'Oren',
  OTHER: 'Overig',
  BREAK: 'Pauze',
};

/**
 * A single time log entry for tracking activities during an appointment.
 */
export interface TimeLog {
  activity: ActivityType;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
}

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
  completed?: boolean; // Whether appointment has been completed
  // Google Calendar sync
  googleCalendarEventId?: string; // Google Calendar event ID for two-way sync
  lastModified?: Date; // Last modification timestamp for conflict resolution
  // Time logging for tablet mode
  timeLogs?: TimeLog[]; // Detailed activity log for analysis
  actualStartTime?: Date; // When the appointment actually started (tablet mode)
  totalActiveMinutes?: number; // Total working time (excluding breaks)
}
