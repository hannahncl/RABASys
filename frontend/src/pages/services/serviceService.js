import { api } from '../../services/api';

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};

const normalizeImages = (value, fallbackImage = '') => {
  const parsed = Array.isArray(value) ? value : parseJson(value, []);
  const images = parsed.filter((image) => typeof image === 'string' && image.trim()).map((image) => image.trim());
  if (images.length) return images;
  return fallbackImage ? [fallbackImage] : [];
};

const normalizePackageType = (item = {}) => {
  const rawType = item.package_type || item.packageType || item.category || item.type || 'tour';
  const normalized = String(rawType).toLowerCase().replace(/\s+/g, '_');
  return ['exclusive', 'joiner', 'tuktrip'].includes(normalized) ? normalized : 'exclusive';
};

const packageFromApi = (item) => ({
  ...item,
  id: String(item.package_id),
  category: normalizePackageType(item),
  packageType: normalizePackageType(item),
  availabilityStatus: item.availability_status ?? item.availabilityStatus ?? 'Available',
  title: item.package_name,
  packageName: item.package_name,
  price: Number(item.price),
  maximumCapacity: item.max_capacity,
  inclusions: parseJson(item.inclusion, item.inclusion ? item.inclusion.split(',').map(x => x.trim()).filter(Boolean) : []),
  itinerary: parseJson(item.itinerary, item.itinerary || []),
  meetingLocation: item.meeting_location,
  images: normalizeImages(item.images, item.image),
  image: normalizeImages(item.images, item.image)[0] || '/CAGSAWA.jpg',
  joinerDate: item.joiner_date || item.joinerDate || '',
  joinerSlots: item.joiner_slots ?? item.joinerSlots ?? '',
  joinerBookingDeadline: item.joiner_booking_deadline || item.joinerBookingDeadline || '',
  joinerReservedSlots: Number(item.joiner_reserved_slots ?? item.joinerReservedSlots ?? 0),
  joinerRemainingSlots: item.joiner_remaining_slots == null && item.joinerRemainingSlots == null
    ? null
    : Number(item.joiner_remaining_slots ?? item.joinerRemainingSlots),
  tags: item.tags || [],
  rating: Number(item.rating || 0),
  reviewsCount: Number(item.reviews_count || 0),
});

const vehicleFromApi = (item) => ({
  ...item,
  id: String(item.vehicle_id),
  category: 'car',
  title: item.vehicle_name,
  vehicleName: item.vehicle_name,
  price: Number(item.daily_rate),
  dailyRate: Number(item.daily_rate),
  vehicleType: item.vehicle_type,
  plateNumber: item.plate_number,
  capacity: `${item.capacity} Passengers`,
  seatingCapacity: item.capacity,
  image: item.image || '/CAGSAWA.jpg',
  duration: 'Per Day',
  availabilityStatus: item.availability_status ?? item.availabilityStatus ?? 'Available',
  fuelType: item.fuel_type || '',
  vehicleBrand: item.vehicle_brand || '',
  transmission: item.transmission || '',
  rating: Number(item.rating || 0),
  reviewsCount: Number(item.reviews_count || 0),
});

const packagePayload = (item) => ({
  package_name: item.packageName || item.title,
  destination: item.destination,
  description: item.description || null,
  price: Number(item.price),
  duration: item.duration,
  inclusion: JSON.stringify(item.inclusions || item.includes || []),
  max_capacity: Number(item.maximumCapacity || item.max_capacity || 1),
  meeting_location: item.meetingLocation || item.meeting_location || null,
  itinerary: JSON.stringify(item.itinerary || []),
  availability_status: item.availabilityStatus || item.availability_status || 'Available',
  package_type: normalizePackageType(item),
  image: item.image || item.images?.[0] || null,
  images: JSON.stringify(normalizeImages(item.images, item.image)),
  // These columns were added for joiner packages. Leave them out of ordinary
  // tour inserts so a database that has not applied the joiner migration can
  // still create exclusive and tuktrip packages.
  ...(normalizePackageType(item) === 'joiner' ? {
    joiner_date: item.joinerDate || item.joiner_date || null,
    joiner_slots: item.joinerSlots === '' || item.joinerSlots == null ? null : Number(item.joinerSlots),
    joiner_booking_deadline: item.joinerBookingDeadline || item.joiner_booking_deadline || null,
  } : {}),
});

const vehiclePayload = (item) => ({
  vehicle_name: item.vehicleName || item.title || item.vehicle_name,
  vehicle_type: item.vehicleType || item.vehicle_type || 'Car',
  plate_number: item.plateNumber || item.plate_number,
  capacity: Number(String(item.seatingCapacity || item.capacity || 1).match(/\d+/)?.[0] || 1),
  daily_rate: Number(item.dailyRate || item.price || item.daily_rate || 0),
  image: item.vehicleImage || item.image || null,
  availability_status: item.availabilityStatus || item.availability_status || 'Available',
  fuel_type: item.fuelType || null,
  vehicle_brand: item.vehicleBrand || null,
  transmission: item.transmission || null,
});

export const serviceService = {
  getAll: async () => (await api('/packages')).map(packageFromApi),
  getByCategory: async (category) => {
    if (category === 'car') return (await api('/vehicles')).map(vehicleFromApi);

    const packages = (await api('/packages')).map(packageFromApi);
    if (category === 'tour') {
      return packages.filter(item => item.category !== 'tuktrip');
    }

    return packages.filter(item => item.category === category);
  },
  getById: async (id, category) => {
    if (category === 'car') {
      return vehicleFromApi(await api(`/vehicles/${id}`));
    }

    try { return packageFromApi(await api(`/packages/${id}`)); }
    catch { return vehicleFromApi(await api(`/vehicles/${id}`)); }
  },
  getRecommendations: async () => (await api('/packages')).map(packageFromApi).slice(0, 3),
  create: async (item) => item.category === 'car'
    ? vehicleFromApi(await api('/vehicles', { method: 'POST', body: JSON.stringify(vehiclePayload(item)) }))
    : packageFromApi(await api('/packages', { method: 'POST', body: JSON.stringify(packagePayload(item)) })),
  update: async (id, item) => item.category === 'car'
    ? vehicleFromApi(await api(`/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(vehiclePayload(item)) }))
    : packageFromApi(await api(`/packages/${id}`, { method: 'PATCH', body: JSON.stringify(packagePayload(item)) })),
  setAvailability: async (id, status) => packageFromApi(await api(`/packages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ availability_status: status }),
  })),
  setVehicleAvailability: async (id, status) => vehicleFromApi(await api(`/vehicles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ availability_status: status }),
  })),
  delete: async (id, category = 'tour') => api(`/${category === 'car' ? 'vehicles' : 'packages'}/${id}`, { method: 'DELETE' }),
};

export const packageService = {
  getAll: async () => (await serviceService.getAll()).filter((item) => String(item.availabilityStatus ?? item.availability_status ?? 'Available').trim().toLowerCase() === 'available'),
  getById: async (id) => {
    const item = await serviceService.getById(id);
    return String(item?.availabilityStatus ?? item?.availability_status ?? 'Available').trim().toLowerCase() === 'available' ? item : null;
  },
  getRecommendations: async (preferences) => (await serviceService.getRecommendations(preferences)).filter((item) => String(item.availabilityStatus ?? item.availability_status ?? 'Available').trim().toLowerCase() === 'available'),
  create: (item) => serviceService.create({ ...item, category: 'tour' }),
  update: (id, item) => serviceService.update(id, { ...item, category: 'tour' }),
  delete: (id) => serviceService.delete(id, 'tour'),
};
