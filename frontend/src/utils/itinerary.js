export const parseItinerary = (data) => {
  let entries = data;
  if (typeof entries === 'string') {
    try {
      const parsed = JSON.parse(entries);
      entries = Array.isArray(parsed) ? parsed : data.split('\n');
    } catch {
      entries = data.split('\n');
    }
  }

  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry, index) => {
      if (typeof entry === 'string') return { day: 1, time: '', activity: entry.trim() };
      if (!entry || typeof entry !== 'object') return null;
      const day = Number(entry.day);
      const startTime = String(entry.startTime || entry.start_time || entry.time || '').trim();
      return {
        day: Number.isInteger(day) && day > 0 ? day : index + 1,
        startTime,
        endTime: String(entry.endTime || entry.end_time || '').trim(),
        activity: String(entry.title || entry.desc || entry.activity || '').trim(),
      };
    })
    .filter((entry) => entry && (entry.startTime || entry.endTime || entry.activity));
};

export const serializeItinerary = (entries) => entries
  .filter((entry) => entry.activity.trim())
  .map((entry) => ({
    day: Number(entry.day),
    time: entry.startTime || null,
    startTime: entry.startTime || null,
    endTime: entry.endTime || null,
    title: entry.activity.trim(),
    desc: entry.activity.trim(),
  }));
