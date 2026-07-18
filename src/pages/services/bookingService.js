import { api } from '../../services/api';

const bookingFromApi = (item) => ({
  ...item,
  id: String(item.booking_id),
  type: 'Tour Packages',
  packageId: String(item.package_id),
  packageName: item.package_name,
  customerName: item.customer_name,
  customerEmail: item.email,
  customerPhone: item.contact_number,
  tourDate: item.travel_date?.slice(0, 10),
  guestsCount: item.number_of_persons,
  totalPrice: Number(item.total_amount),
  status: item.booking_status === 'Pending' ? 'Pending Verification' : item.booking_status,
  createdAt: item.created_at,
  paymentRef: item.booking_reference,
});

const rentalBookingFromApi = (item) => ({
  ...item,
  id: String(item.rental_booking_id),
  type: 'Car Rental',
  packageId: String(item.vehicle_id),
  packageName: item.vehicle_name,
  customerName: item.customer_name,
  customerEmail: item.email,
  customerPhone: item.contact_number,
  tourDate: item.pickup_date?.slice(0, 10), // Map pickup_date to tourDate for UI consistency
  returnDate: item.return_date?.slice(0, 10),
  pickupLocation: item.pickup_location,
  guestsCount: 1, // Default for cars, as it's not stored per booking but rather by vehicle capacity
  totalPrice: Number(item.total_amount),
  status: item.booking_status === 'Pending' ? 'Pending Verification' : item.booking_status,
  createdAt: item.created_at,
  paymentRef: item.booking_reference,
  plateNumber: item.plate_number,
});

export const bookingService = {
  getAll: async () => {
    const [tours, rentals] = await Promise.all([
      api('/bookings').catch(e => { console.error('Tours API error:', e.message); return []; }),
      api('/rental-bookings').catch(e => { console.error('Rentals API error:', e.message); return []; })
    ]);
    console.log(`[bookingService] Tours: ${tours.length}, Rentals: ${rentals.length}`);
    return [
      ...tours.map(bookingFromApi),
      ...rentals.map(rentalBookingFromApi)
    ];
  },
  getById: async (id, type = 'Tour Packages') => {
    if (type === 'Car Rental') {
      return rentalBookingFromApi(await api(`/rental-bookings/${id}`));
    }
    return bookingFromApi(await api(`/bookings/${id}`));
  },
  create: async (item) => bookingFromApi(await api('/bookings', {
    method: 'POST',
    body: JSON.stringify({ package_id: Number(item.packageId), travel_date: item.tourDate, number_of_persons: Number(item.guestsCount) }),
  })),
  createRental: async (item) => rentalBookingFromApi(await api('/rental-bookings', {
    method: 'POST',
    body: JSON.stringify({ 
      vehicle_id: item.vehicleId, 
      pickup_date: item.pickupDate, 
      return_date: item.returnDate,
      pickup_location: item.pickupLocation 
    }),
  })),
  updateStatus: async (id, status, type = 'Tour Packages') => {
    const endpoint = type === 'Car Rental' ? `/rental-bookings/${id}/status` : `/bookings/${id}/status`;
    const payloadStatus = status === 'Pending Verification' ? 'Pending' : status;
    const res = await api(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ booking_status: payloadStatus }),
    });
    return type === 'Car Rental' ? rentalBookingFromApi(res) : bookingFromApi(res);
  },
};
