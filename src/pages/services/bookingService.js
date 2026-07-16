// Mock Booking Service with LocalStorage persistence to link roles together in the frontend sandbox
import { emailService } from './emailService';

const STORAGE_KEY = 'rabas_bookings_db';

const DEFAULT_BOOKINGS = [
  {
    id: 'RBT-9820-21',
    packageId: 'el-nido-premium',
    packageName: 'El Nido Premium Island Hopping',
    type: 'Tour Packages',
    customerName: 'Jose Rizal',
    customerEmail: 'jose.rizal@example.com',
    customerPhone: '09171234567',
    tourDate: '2026-07-15',
    guestsCount: 2,
    totalPrice: 37000,
    paymentMethod: 'GCash',
    paymentRef: 'GC-9871654',
    status: 'Pending Verification', // Pending Verification, Confirmed, Cancelled
    createdAt: '2026-06-20T10:30:00Z',
    gcashNumber: '09171234567'
  },
  {
    id: 'RBT-3210-99',
    packageId: 'boracay-sunset-getaway',
    packageName: 'Boracay Sunset & Watersports Escape',
    type: 'Tour Packages',
    customerName: 'Maria Clara',
    customerEmail: 'maria.clara@example.com',
    customerPhone: '09187654321',
    tourDate: '2026-07-20',
    guestsCount: 4,
    totalPrice: 48000,
    paymentMethod: 'GCash',
    paymentRef: 'GC-1230491',
    status: 'Confirmed',
    createdAt: '2026-06-22T14:15:00Z',
    gcashNumber: '09187654321'
  },
  {
    id: 'RBT-7741-02',
    packageId: 'siargao-surf-adventure',
    packageName: 'Siargao Surf & Island Hop Adventure',
    type: 'Tour Packages',
    customerName: 'Juan Dela Cruz',
    customerEmail: 'juan.delacruz@example.com',
    customerPhone: '09228881234',
    tourDate: '2026-08-02',
    guestsCount: 1,
    totalPrice: 15800,
    paymentMethod: 'GCash',
    paymentRef: 'GC-7741982',
    status: 'Pending Verification',
    createdAt: '2026-06-24T09:00:00Z',
    gcashNumber: '09228881234'
  },
  {
    id: 'TUK-1122-33',
    packageId: 'tuktrip-city-tour',
    packageName: 'City Tour via TukTuk',
    type: 'TukTrip',
    customerName: 'Andres Bonifacio',
    customerEmail: 'andres.b@example.com',
    customerPhone: '09191112222',
    tourDate: '2026-08-10',
    guestsCount: 3,
    totalPrice: 1500,
    paymentMethod: 'GCash',
    paymentRef: 'GC-1122334',
    status: 'Confirmed',
    createdAt: '2026-06-25T11:00:00Z',
    gcashNumber: '09191112222'
  },
  {
    id: 'CAR-4455-66',
    packageId: 'car-sedan-rental',
    packageName: 'Toyota Vios Rental (2 Days)',
    type: 'Car Rental',
    customerName: 'Emilio Aguinaldo',
    customerEmail: 'emilio.a@example.com',
    customerPhone: '09204445555',
    tourDate: '2026-08-15',
    guestsCount: 4,
    totalPrice: 5000,
    paymentMethod: 'GCash',
    paymentRef: 'GC-4455667',
    status: 'Pending Verification',
    createdAt: '2026-06-26T14:30:00Z',
    gcashNumber: '09204445555'
  }
];

// Initialize database if empty
if (!localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BOOKINGS));
} else {
  // Ensure we have at least one TukTrip and one Car Rental for demonstration
  let list = JSON.parse(localStorage.getItem(STORAGE_KEY));
  let hasTukTrip = list.some(b => b.type === 'TukTrip');
  let hasCarRental = list.some(b => b.type === 'Car Rental');
  if (!hasTukTrip || !hasCarRental) {
    const defaultData = DEFAULT_BOOKINGS.filter(b => 
      (!hasTukTrip && b.type === 'TukTrip') || (!hasCarRental && b.type === 'Car Rental')
    );
    list = [...list, ...defaultData];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

export const bookingService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  },

  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return list.find(b => b.id === id) || null;
  },

  create: async (bookingData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    const newBooking = {
      id: `RBT-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 90)}`,
      createdAt: new Date().toISOString(),
      status: 'Pending Verification',
      ...bookingData
    };
    
    list.unshift(newBooking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    
    // Trigger simulation email
    await emailService.sendBookingConfirmation(newBooking);
    
    return newBooking;
  },

  updateStatus: async (id, status) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const index = list.findIndex(b => b.id === id);
    
    if (index === -1) throw new Error('Booking not found');
    
    list[index].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    
    // Trigger approval email simulation if approved
    if (status === 'Confirmed') {
      await emailService.sendPaymentApproval(list[index]);
    }
    
    return list[index];
  }
};
