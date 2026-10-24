const isValidDate = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

export const earliestBookingDeadline = (departureDate) => {
  const date = String(departureDate || '').slice(0, 10);
  if (!isValidDate(date)) return '';

  const departure = new Date(`${date}T00:00:00Z`);
  departure.setUTCDate(departure.getUTCDate() - 3);
  return departure.toISOString().slice(0, 10);
};

export const isJoinerDeadlineValid = (departureDate, bookingDeadline) => {
  const earliestDeadline = earliestBookingDeadline(departureDate);
  const deadline = String(bookingDeadline || '').slice(0, 10);
  return Boolean(earliestDeadline && isValidDate(deadline) && deadline <= earliestDeadline);
};
