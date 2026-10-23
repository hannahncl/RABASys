// Mock service representing analytical data calculations for Admins

export const reportService = {
  getSalesData: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      { month: 'Jan', bookings: 25, sales: 310000 },
      { month: 'Feb', bookings: 32, sales: 412000 },
      { month: 'Mar', bookings: 45, sales: 580000 },
      { month: 'Apr', bookings: 68, sales: 890000 },
      { month: 'May', bookings: 85, sales: 1120000 },
      { month: 'Jun', bookings: 92, sales: 1250000 }
    ];
  },

  getExpenseData: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      { category: 'Accommodation Partner Pay', value: 450000, color: '#06b6d4' },
      { category: 'Transportation & Flights', value: 290000, color: '#f97316' },
      { category: 'Local Tour Guides & Permits', value: 180000, color: '#10b981' },
      { category: 'Marketing & Ad Campaigns', value: 95000, color: '#a855f7' },
      { category: 'Staff Salaries', value: 220000, color: '#f43f5e' }
    ];
  },

  getMostVisitedDestinations: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      { name: 'El Nido, Palawan', bookings: 124, revenue: 2294000 },
      { name: 'Boracay, Aklan', bookings: 98, revenue: 1176000 },
      { name: 'Siargao, Surigao', bookings: 82, revenue: 1295600 },
      { name: 'Cebu & Bohol', bookings: 64, revenue: 1056000 },
      { name: 'Basco, Batanes', bookings: 38, revenue: 931000 }
    ];
  },

  getKPIs: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      totalSales: 4562000,
      salesGrowth: '+18.4%',
      activeBookings: 54,
      totalExpenses: 1235000,
      netProfit: 3327000,
      conversionRate: '4.8%'
    };
  }
};
