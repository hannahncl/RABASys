export const getCarCapacity = (car) => {
  const raw = car?.seatingCapacity ?? car?.capacity ?? car?.seats ?? car?.seating_capacity;

  if (raw === null || raw === undefined || raw === '') {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  const match = String(raw).match(/\d+/);
  return match ? Number(match[0]) : null;
};

export const getCarPrice = (car) => {
  const raw = car?.price ?? car?.dailyRate ?? car?.daily_rate ?? car?.pricePerDay;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const isCarAvailable = (car) => {
  const rawStatus = [car?.availabilityStatus, car?.availability_status, car?.status]
    .find((value) => value !== null && value !== undefined && String(value).trim() !== '');

  if (!rawStatus) {
    return true;
  }

  return String(rawStatus).trim().toLowerCase() === 'available';
};

export const filterCars = (cars = [], { capacity = 0, priceRange = [0, Number.MAX_SAFE_INTEGER] } = {}) => {
  const [minPrice, maxPrice] = priceRange;

  return (cars || []).filter((car) => {
    if (!isCarAvailable(car)) {
      return false;
    }

    const carCapacity = getCarCapacity(car);
    const meetsCapacity = carCapacity === null || carCapacity >= capacity;
    const carPrice = getCarPrice(car);
    const meetsPrice = carPrice >= minPrice && carPrice <= maxPrice;

    return meetsCapacity && meetsPrice;
  });
};
