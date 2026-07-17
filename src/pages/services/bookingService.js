import { api } from '../../services/api';

const bookingFromApi = (item) => ({
  ...item,
  id: String(item.booking_id),
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

export const bookingService = {
  getAll: async () => (await api('/bookings')).map(bookingFromApi),
  getById: async (id) => bookingFromApi(await api(`/bookings/${id}`)),
  create: async (item) => bookingFromApi(await api('/bookings', {
    method: 'POST',
    body: JSON.stringify({ package_id: Number(item.packageId), travel_date: item.tourDate, number_of_persons: Number(item.guestsCount) }),
  })),
  updateStatus: async (id, status) => bookingFromApi(await api(`/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ booking_status: status === 'Pending Verification' ? 'Pending' : status }),
  })),
};
