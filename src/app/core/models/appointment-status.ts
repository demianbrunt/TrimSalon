export const APPOINTMENT_STATUS = {
  all: 'all',
  open: 'open',
  completed: 'completed',
} as const;

export type AppointmentStatus =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];
