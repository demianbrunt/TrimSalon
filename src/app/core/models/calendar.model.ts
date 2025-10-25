export interface GoogleCalendarList {
  items: GoogleCalendar[];
}

export interface GoogleCalendar {
  id: string;
  summary: string;
}

export interface GoogleCalendarEventListResponse {
  items: GoogleCalendarEvent[];
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  extendedProperties?: {
    private?: Record<string, string>;
  };
}
