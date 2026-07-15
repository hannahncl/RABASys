// Mock email notification services to show client-side triggers

export const emailService = {
  sendBookingConfirmation: async (bookingDetails) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.group('%c [EMAIL SIMULATOR] Booking Confirmation Sent ', 'background: #0284c7; color: white; padding: 4px; border-radius: 4px;');
    console.log(`To: ${bookingDetails.customerEmail}`);
    console.log(`Subject: Booking Confirmed - Reference: ${bookingDetails.id}`);
    console.log(`Content: Thank you, ${bookingDetails.customerName}! Your booking for "${bookingDetails.packageName}" is pending verification.`);
    console.log(`Total Price: PHP ${bookingDetails.totalPrice.toLocaleString()}`);
    console.groupEnd();
    return { success: true, messageId: `msg_${Math.random().toString(36).substr(2, 9)}` };
  },

  sendPaymentApproval: async (bookingDetails) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.group('%c [EMAIL SIMULATOR] Payment Approved ', 'background: #16a34a; color: white; padding: 4px; border-radius: 4px;');
    console.log(`To: ${bookingDetails.customerEmail}`);
    console.log(`Subject: Payment Verified - Tour Confirmed!`);
    console.log(`Content: Good news! Your payment of PHP ${bookingDetails.totalPrice.toLocaleString()} via GCash has been approved by our staff.`);
    console.log(`Tour Date: ${bookingDetails.tourDate}`);
    console.groupEnd();
    return { success: true };
  },

  sendExpenseReportNotification: async (reportMeta) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.group('%c [EMAIL SIMULATOR] Admin Expense Report Notification ', 'background: #dc2626; color: white; padding: 4px; border-radius: 4px;');
    console.log(`To: admin@rabastravel.com`);
    console.log(`Subject: Alert: New Expense Logged`);
    console.log(`Content: An expense of PHP ${reportMeta.amount.toLocaleString()} was logged under category "${reportMeta.category}" by staff member "${reportMeta.loggedBy}".`);
    console.groupEnd();
    return { success: true };
  }
};
