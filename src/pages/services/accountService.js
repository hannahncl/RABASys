import { api } from '../../services/api';

const roleFromApi = (role) => ({ Customer: 'customer', Admin: 'admin', 'Tour Guide': 'tour-guide' })[role] || role;
const roleToApi = (role) => ({ customer: 'Customer', admin: 'Admin', 'tour-guide': 'Tour Guide' })[role] || role;
const fromApi = (item) => ({
  ...item,
  id: String(item.account_id),
  firstName: item.first_name,
  lastName: item.last_name,
  name: `${item.first_name} ${item.last_name}`,
  email: item.email,
  phone: item.contact_number,
  contactNumber: item.contact_number,
  role: roleFromApi(item.role),
  status: item.account_status,
  createdAt: item.created_at,
});
const toApi = (item) => ({
  first_name: item.firstName,
  last_name: item.lastName,
  email: item.email,
  contact_number: item.phone || item.contactNumber,
  role: roleToApi(item.role),
  account_status: item.status,
});

export const accountService = {
  getAll: async () => (await api('/accounts')).map(fromApi),
  getById: async (id) => fromApi(await api(`/accounts/${id}`)),
  // Admin account creation requires a password, so public registration is used for customer accounts.
  create: async (item) => {
    if (item.role && item.role !== 'customer') throw new Error('Create staff accounts from the backend admin workflow after setting an initial password.');
    const result = await api('/auth/register', { method: 'POST', body: JSON.stringify({ firstName: item.firstName, lastName: item.lastName, email: item.email, password: item.password, contactNumber: item.phone || item.contactNumber }) });
    return fromApi(result.user);
  },
  update: async (id, item) => fromApi(await api(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(toApi(item)) })),
  delete: async (id) => api(`/accounts/${id}`, { method: 'DELETE' }),
  toggleStatus: async (id, currentStatus) => fromApi(await api(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify({ account_status: currentStatus === 'Active' ? 'Inactive' : 'Active' }) })),
};
