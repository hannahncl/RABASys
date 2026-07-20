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
  // Fetch all accounts (customers + all roles) — via resource route for admin page
  getAll: async () => {
    const [accounts, guides] = await Promise.all([
      api('/accounts').catch(() => []),
      api('/tour-guides').catch(() => []),
    ]);

    // Merge: tour guides from /tour-guides (has full profile data), customers from /accounts
    const guideIds = new Set(guides.map(g => String(g.id)));
    const customers = accounts
      .filter(a => !guideIds.has(String(a.account_id)) && (a.role === 'Customer'))
      .map(fromApi);

    return [...guides, ...customers];
  },

  getById: async (id) => fromApi(await api(`/accounts/${id}`)),

  // Create a Tour Guide account (uses new dedicated endpoint)
  createTourGuide: async (item) => {
    return api('/tour-guides', {
      method: 'POST',
      body: JSON.stringify({
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        password: item.password,
        contactNumber: item.phone || item.contactNumber,
        sex: item.sex || 'Male',
        birthDate: item.birthDate || null,
        yearsExperience: item.yearsExperience ? Number(item.yearsExperience) : 0,
        description: item.description || null,
        languageSpoken: item.languageSpoken || null,
      }),
    });
  },

  // Update a Tour Guide profile
  updateTourGuide: async (id, item) => {
    return api(`/tour-guides/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        contactNumber: item.phone || item.contactNumber,
        sex: item.sex || null,
        birthDate: item.birthDate || null,
        yearsExperience: item.yearsExperience ? Number(item.yearsExperience) : null,
        description: item.description || null,
        languageSpoken: item.languageSpoken || null,
      }),
    });
  },

  update: async (id, item) => fromApi(await api(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(toApi(item)) })),
  delete: async (id) => api(`/accounts/${id}`, { method: 'DELETE' }),

  // Toggle account_status (Active / Inactive)
  toggleStatus: async (id) => api(`/tour-guides/${id}/status`, { method: 'PATCH' }),

  // Toggle tour_guide availability_status
  toggleAvailability: async (id) => api(`/tour-guides/${id}/availability`, { method: 'PATCH' }),

  // Toggle tour_guide employment_status
  toggleEmployment: async (id) => api(`/tour-guides/${id}/employment`, { method: 'PATCH' }),
};
