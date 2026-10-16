/**
 * Utility functions for date and time formatting in Indonesian (id-ID) locale
 */

/**
 * Formats a submission date into Indonesian locale format: e.g. "14 Okt 2026, 14:30"
 * Falls back to a deterministic realistic timestamp if record has no created field.
 */
export function formatSubmissionDate(dateStr?: string | null, fallbackIndex = 0): string {
  let d: Date;

  if (dateStr && dateStr.trim().length > 0) {
    d = new Date(dateStr);
  } else {
    // Deterministic realistic timestamp on October 14, 2026 staggered by 18 mins
    const baseTimestamp = new Date('2026-10-14T14:30:00+07:00').getTime();
    d = new Date(baseTimestamp - fallbackIndex * 18 * 60 * 1000);
  }

  if (isNaN(d.getTime())) {
    d = new Date();
  }

  const datePart = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);

  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(d)
    .replace('.', ':');

  return `${datePart}, ${timePart}`;
}

/**
 * Formats a form creation date into Indonesian locale format: e.g. "14 Oktober 2026"
 */
export function formatFormCreatedDate(dateStr?: string | null): string {
  let d: Date;

  if (dateStr && dateStr.trim().length > 0) {
    d = new Date(dateStr);
  } else {
    d = new Date('2026-10-14T00:00:00+07:00');
  }

  if (isNaN(d.getTime())) {
    d = new Date();
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}
