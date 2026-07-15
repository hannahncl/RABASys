// Mock Account Service with LocalStorage persistence for managing staff & tourist accounts

const STORAGE_KEY = 'rabas_accounts_db';

const DEFAULT_ACCOUNTS = [
  {
    id: 'ACC-001',
    name: 'Rabas Admin',
    email: 'admin@rabastravel.com',
    username: 'admin',
    role: 'admin',
    status: 'Active',
    phone: '09171000001',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'ACC-002',
    name: 'Rabas Coordinator',
    email: 'staff@rabastravel.com',
    username: 'staff',
    role: 'staff',
    status: 'Active',
    phone: '09171000002',
    createdAt: '2026-01-15T00:00:00Z'
  },
  {
    id: 'ACC-003',
    name: 'Maria Santos',
    email: 'maria.santos@rabastravel.com',
    username: 'maria.santos',
    role: 'staff',
    status: 'Active',
    phone: '09181234567',
    createdAt: '2026-02-10T00:00:00Z'
  },
  {
    id: 'ACC-004',
    name: 'Carlos Reyes',
    email: 'carlos.reyes@rabastravel.com',
    username: 'carlos.reyes',
    role: 'staff',
    status: 'Inactive',
    phone: '09191234567',
    createdAt: '2026-03-05T00:00:00Z'
  },
  {
    id: 'ACC-005',
    name: 'Happy Tourist',
    email: 'tourist@gmail.com',
    username: 'tourist',
    role: 'customer',
    status: 'Active',
    phone: '09201234567',
    createdAt: '2026-04-20T00:00:00Z'
  },
  {
    id: 'ACC-006',
    name: 'Jose Rizal',
    email: 'jose.rizal@example.com',
    username: 'jose.rizal',
    role: 'customer',
    status: 'Active',
    phone: '09171234567',
    createdAt: '2026-05-12T00:00:00Z'
  },
  {
    id: 'ACC-007',
    name: 'Maria Clara',
    email: 'maria.clara@example.com',
    username: 'maria.clara',
    role: 'customer',
    status: 'Active',
    phone: '09187654321',
    createdAt: '2026-05-25T00:00:00Z'
  },
  {
    id: 'ACC-008',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@example.com',
    username: 'juan.delacruz',
    role: 'customer',
    status: 'Inactive',
    phone: '09228881234',
    createdAt: '2026-06-01T00:00:00Z'
  }
];

// Initialize database if empty
if (!localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
}

export const accountService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  },

  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return list.find(a => a.id === id) || null;
  },

  create: async (accountData) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    const newAccount = {
      id: `ACC-${String(list.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      status: 'Active',
      ...accountData
    };

    list.push(newAccount);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return newAccount;
  },

  update: async (id, updates) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const index = list.findIndex(a => a.id === id);

    if (index === -1) throw new Error('Account not found');

    list[index] = { ...list[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list[index];
  },

  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const filtered = list.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  toggleStatus: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const index = list.findIndex(a => a.id === id);

    if (index === -1) throw new Error('Account not found');

    list[index].status = list[index].status === 'Active' ? 'Inactive' : 'Active';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list[index];
  }
};
