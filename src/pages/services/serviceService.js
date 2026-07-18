import { api } from '../../services/api';

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};

const packageFromApi = (item) => ({
  ...item,
  id: String(item.package_id),
  category: 'tour',
  title: item.package_name,
  packageName: item.package_name,
  price: Number(item.price),
  maximumCapacity: item.max_capacity,
  inclusions: parseJson(item.inclusion, item.inclusion ? item.inclusion.split(',').map(x => x.trim()).filter(Boolean) : []),
  itinerary: parseJson(item.itinerary, item.itinerary || []),
  meetingLocation: item.meeting_location,
  image: item.image || '/CAGSAWA.jpg',
  tags: item.tags || [],
  rating: Number(item.rating || 0),
  reviewsCount: Number(item.reviews_count || 0),
});

const vehicleFromApi = (item) => ({
  ...item,
  id: String(item.vehicle_id),
  category: 'car',
  title: item.vehicle_name,
  price: Number(item.daily_rate),
  vehicleType: item.vehicle_type,
  plateNumber: item.plate_number,
  capacity: `${item.capacity} Passengers`,
  image: item.image || '/CAGSAWA.jpg',
  description: item.description,
  color: item.color,
  pickupLocation: item.pickup_location,
  duration: 'Per Day',
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
});

const vehiclePayload = (item) => ({
  vehicle_name: item.title || item.vehicleName || item.vehicle_name,
  vehicle_type: item.vehicleType || item.vehicle_type || 'Car',
  plate_number: item.plateNumber || item.plate_number || null,
  capacity: Number(String(item.capacity || item.seatingCapacity || 1).match(/\d+/)?.[0] || 1),
  daily_rate: Number(item.price || item.daily_rate || 0),
  availability_status: item.availabilityStatus || item.availability_status || 'Available',
  image: item.image || item.vehicleImage || null,
  description: item.description || item.details || null,
  color: item.color || null,
  pickup_location: item.pickupLocation || item.destination || null,
});

export const serviceService = {
  getAll: async () => (await api('/packages')).map(packageFromApi),
  getByCategory: async (category) => {
    if (category === 'car') return (await api('/vehicles')).map(vehicleFromApi);
    // The current schema has tour_package but no separate TukTrip table.
    return (await api('/packages')).map(packageFromApi).filter(item => category === 'tour' || item.category === category);
  },
  getById: async (id) => {
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
  delete: async (id, category = 'tour') => api(`/${category === 'car' ? 'vehicles' : 'packages'}/${id}`, { method: 'DELETE' }),
};

export const packageService = {
  getAll: () => serviceService.getByCategory('tour'),
  getById: (id) => serviceService.getById(id),
  getRecommendations: (preferences) => serviceService.getRecommendations(preferences),
  create: (item) => serviceService.create({ ...item, category: 'tour' }),
  update: (id, item) => serviceService.update(id, { ...item, category: 'tour' }),
  delete: (id) => serviceService.delete(id, 'tour'),
};
