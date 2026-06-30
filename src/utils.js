export function calendarNights(itin) {
  if (!itin.leg1?.date || !itin.leg2?.date) return null;
  const d1 = new Date(itin.leg1.date);
  const d2 = new Date(itin.leg2.date);
  return Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
}

export function formatDateFriendly(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = date.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";

  return `${day}${suffix} ${monthNames[date.getMonth()]}, ${dayNames[date.getDay()]}`;
}

export function formatDuration(h) {
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${Math.floor(h / 24)}d ${(h % 24).toFixed(1)}h`;
}

export function bestLayoverScore(itin) {
  let price = itin.totalPrice || 1;
  // Van itineraries are their own accommodation, so no hotel penalty.
  if (itin.type !== 'IMOOVA_VAN_ITINERARY_FOUND') {
    const nights = calendarNights(itin) || 0;
    price += nights * 50; // £50 penalty per night for regular hub hotels
  }
  const usable = itin.daytimeValue ?? 0;
  return price > 0 ? usable / price : 0;
}

export function parseTime(timeStr) {
  if (!timeStr) return null;
  const cleanStr = timeStr.split('+')[0].trim().toUpperCase();
  // Try AM/PM format (e.g. "6:00 AM" or "10:30 PM")
  const ampmMatch = cleanStr.match(/^(\d+):(\d+)\s*(AM|PM)$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const ampm = ampmMatch[3];
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  // Try 24h format (e.g. "18:00" or "06:00")
  const h24Match = cleanStr.match(/^(\d+):(\d+)$/);
  if (h24Match) {
    const hours = parseInt(h24Match[1], 10);
    const minutes = parseInt(h24Match[2], 10);
    return hours * 60 + minutes;
  }
  return null;
}

export function formatTimeFriendly(minutes) {
  if (minutes === 0 || minutes === 1440) return 'Any Time';
  let hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minStr = mins < 10 ? `0${mins}` : mins;
  return `${hours}:${minStr} ${ampm}`;
}


