import { format } from 'date-fns';

/**
 * Formats a date string or object in a specific timezone using Intl.DateTimeFormat
 * @param date The date to format
 * @param timeZone The target IANA timezone string
 * @param formatStr The desired format (simplified, mapped to Intl options)
 */
export const formatInTimeZone = (
  date: string | Date, 
  timeZone: string = 'UTC', 
  options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
) => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone }).format(d);
  } catch (err) {
    console.error('Timezone formatting error:', err);
    return format(new Date(date), 'PPpp'); // Fallback to local
  }
};

/**
 * A more specific helper for common appointment formats
 */
export const formatAppointmentTime = (date: string | Date, timeZone: string = 'UTC') => {
  return {
    date: formatInTimeZone(date, timeZone, { weekday: 'long', month: 'long', day: 'numeric' }),
    time: formatInTimeZone(date, timeZone, { hour: '2-digit', minute: '2-digit', hour12: true }),
    full: formatInTimeZone(date, timeZone, { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    })
  };
};

export const getDateKeyInTimeZone = (date: string | Date, timeZone: string = 'UTC') => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  return `${year}-${month}-${day}`;
};

export const formatDateTimeInputInTimeZone = (date: string | Date, timeZone: string = 'UTC') => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  return `${year}-${month}-${day}T${hour}:${minute}`;
};
