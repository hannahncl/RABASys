import React, { useEffect, useMemo, useState } from 'react';
import { bookingService } from '../../services/bookingService';
import { CheckCircle2, DollarSign, Download, FileText, Loader, Printer, ReceiptText, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const normalizeStatus = (status = '') => String(status || '').trim().toLowerCase().replace(/\s+/g, '');

const isRecognizedSale = (status = '') => {
  const s = normalizeStatus(status);
  return s === 'confirmed' || s === 'completed' || s === 'rescheduled';
};

const getBookingType = (booking) => {
  if (!booking) return 'Tour Packages';
  if (booking.type === 'Car Rental' || booking.type === 'car') return 'Car Rental';
  if (booking.type === 'TukTrip' || booking.type === 'Tuktrip' || booking.type === 'tuktrip') return 'TukTrip';
  const typeStr = String(booking.type || booking.package_type || '').toLowerCase();
  const pkgStr = String(booking.packageName || booking.package_name || '').toLowerCase();
  const catStr = String(booking.category || '').toLowerCase();
  if (typeStr.includes('tuktrip') || catStr.includes('tuktrip') || pkgStr.includes('tuktrip')) {
    return 'TukTrip';
  }
  return 'Tour Packages';
};

const getRentalDays = (booking) => {
  if (!booking.tourDate || !booking.returnDate) return 1;
  const start = new Date(booking.tourDate.replace(/-/g, '/'));
  const end = new Date(booking.returnDate.replace(/-/g, '/'));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

const getBookingDate = (b) => {
  const dateStr = b.createdAt || b.created_at || b.tourDate || b.travel_date || b.pickup_date;
  if (!dateStr) return null;
  const formattedStr = dateStr.includes('T') ? dateStr : dateStr.replace(/-/g, '/');
  const d = new Date(formattedStr);
  return Number.isNaN(d.getTime()) ? null : d;
};

const filterByDateRange = (booking, rangeType, startDate, endDate) => {
  if (!rangeType) return true;
  const d = getBookingDate(booking);
  if (!d) return true;

  const now = new Date();

  if (rangeType === 'Today') {
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  if (rangeType === 'This Week') {
    const startOfWeek = new Date(now);
    const day = now.getDay();
    startOfWeek.setDate(now.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return d >= startOfWeek && d <= endOfWeek;
  }

  if (rangeType === 'This Month') {
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  if (rangeType === 'This Year') {
    return d.getFullYear() === now.getFullYear();
  }

  if (rangeType === 'Custom') {
    if (startDate && endDate) {
      const s = new Date(startDate.replace(/-/g, '/'));
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate.replace(/-/g, '/'));
      e.setHours(23, 59, 59, 999);
      return d >= s && d <= e;
    }
    if (startDate) {
      const s = new Date(startDate.replace(/-/g, '/'));
      s.setHours(0, 0, 0, 0);
      return d >= s;
    }
    if (endDate) {
      const e = new Date(endDate.replace(/-/g, '/'));
      e.setHours(23, 59, 59, 999);
      return d <= e;
    }
    return true;
  }

  return true;
};

const serviceCategories = ['Tour Packages', 'TukTrip', 'Car Rental'];

const getCategoryPackageStats = (searchFilteredBookings, categoryType) => {
  const categoryBookings = searchFilteredBookings.filter((b) => getBookingType(b) === categoryType);
  const map = new Map();
  categoryBookings.forEach((b) => {
    const name = b.packageName || `${categoryType} Item`;
    if (!map.has(name)) {
      map.set(name, {
        packageName: name,
        bookingsCount: 0,
        touristsCount: 0,
        totalSales: 0,
        prices: [],
      });
    }
    const item = map.get(name);
    item.bookingsCount += 1;
    item.touristsCount += (Number(b.guestsCount) || 1);
    if (isRecognizedSale(b.status)) {
      item.totalSales += (Number(b.totalPrice) || 0);
    }
    if (b.totalPrice) {
      item.prices.push(Number(b.totalPrice));
    }
  });

  const rows = Array.from(map.values()).map((pkg) => {
    const pricePerBooking = pkg.prices.length > 0
      ? pkg.prices.reduce((a, b) => a + b, 0) / pkg.prices.length
      : 0;
    return {
      packageName: pkg.packageName,
      bookingsCount: pkg.bookingsCount,
      touristsCount: pkg.touristsCount,
      pricePerBooking,
      totalSales: pkg.totalSales,
    };
  });

  const totalBookingsCount = rows.reduce((acc, r) => acc + r.bookingsCount, 0);
  const totalTouristsCount = rows.reduce((acc, r) => acc + r.touristsCount, 0);
  const grandTotalSales = rows.reduce((acc, r) => acc + r.totalSales, 0);
  const overallPricePerBooking = totalBookingsCount > 0 ? grandTotalSales / totalBookingsCount : 0;

  const totalRow = {
    packageName: 'TOTAL',
    bookingsCount: totalBookingsCount,
    touristsCount: totalTouristsCount,
    pricePerBooking: overallPricePerBooking,
    totalSales: grandTotalSales,
  };

  return { rows, totalRow };
};

const SalesReports = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  // Filter input controls state
  const [activeType, setActiveType] = useState('ALL');
  const [dateRange, setDateRange] = useState('This Month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Applied filter state (drives data calculations when "Apply Filters" is clicked)
  const [appliedFilters, setAppliedFilters] = useState({
    activeType: 'ALL',
    dateRange: 'This Month',
    startDate: '',
    endDate: '',
    searchTerm: '',
  });

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      const data = await bookingService.getAll();
      setBookings(data);
      setLoading(false);
    };
    loadBookings();
  }, []);

  const handleApplyFilters = () => {
    setAppliedFilters({
      activeType,
      dateRange,
      startDate,
      endDate,
      searchTerm,
    });
  };

  const handleResetFilters = () => {
    setActiveType('ALL');
    setDateRange('This Month');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setAppliedFilters({
      activeType: 'ALL',
      dateRange: 'This Month',
      startDate: '',
      endDate: '',
      searchTerm: '',
    });
  };

  const dateFilteredBookings = useMemo(() => {
    return bookings.filter((b) =>
      filterByDateRange(b, appliedFilters.dateRange, appliedFilters.startDate, appliedFilters.endDate)
    );
  }, [bookings, appliedFilters.dateRange, appliedFilters.startDate, appliedFilters.endDate]);

  const searchFilteredBookings = useMemo(() => {
    if (!appliedFilters.searchTerm.trim()) return dateFilteredBookings;
    const term = appliedFilters.searchTerm.toLowerCase();
    return dateFilteredBookings.filter((b) => {
      const pName = String(b.packageName || '').toLowerCase();
      const cName = String(b.customerName || '').toLowerCase();
      const cEmail = String(b.customerEmail || '').toLowerCase();
      const cPhone = String(b.customerPhone || '').toLowerCase();
      const status = String(b.status || '').toLowerCase();
      const ref = String(b.paymentRef || '').toLowerCase();
      const type = String(b.type || '').toLowerCase();
      return (
        pName.includes(term) ||
        cName.includes(term) ||
        cEmail.includes(term) ||
        cPhone.includes(term) ||
        status.includes(term) ||
        ref.includes(term) ||
        type.includes(term)
      );
    });
  }, [dateFilteredBookings, appliedFilters.searchTerm]);

  // Summary breakdown for ALL services
  const serviceStats = useMemo(() => {
    const totalConfirmedSalesAll = searchFilteredBookings
      .filter((b) => isRecognizedSale(b.status))
      .reduce((acc, b) => acc + (Number(b.totalPrice) || 0), 0);

    const rows = serviceCategories.map((serviceName) => {
      const bList = searchFilteredBookings.filter((b) => getBookingType(b) === serviceName);
      const bookingsCount = bList.length;
      const customersCount = new Set(
        bList.map((b) => (b.customerEmail || b.customerName || b.customerPhone || '').toLowerCase()).filter(Boolean)
      ).size;

      const totalSales = bList
        .filter((b) => isRecognizedSale(b.status))
        .reduce((acc, b) => acc + (Number(b.totalPrice) || 0), 0);

      const percentage = totalConfirmedSalesAll > 0
        ? ((totalSales / totalConfirmedSalesAll) * 100).toFixed(1)
        : '0.0';

      return {
        service: serviceName,
        bookingsCount,
        customersCount,
        totalSales,
        percentage: `${percentage}%`,
      };
    });

    const totalBookingsCount = rows.reduce((acc, r) => acc + r.bookingsCount, 0);
    const totalCustomersCount = new Set(
      searchFilteredBookings.map((b) => (b.customerEmail || b.customerName || b.customerPhone || '').toLowerCase()).filter(Boolean)
    ).size;
    const grandTotalSales = rows.reduce((acc, r) => acc + r.totalSales, 0);
    const totalPercentage = totalConfirmedSalesAll > 0
      ? ((grandTotalSales / totalConfirmedSalesAll) * 100).toFixed(1)
      : '0.0';

    const totalRow = {
      service: 'TOTAL',
      bookingsCount: totalBookingsCount,
      customersCount: totalCustomersCount,
      totalSales: grandTotalSales,
      percentage: `${totalPercentage}%`,
    };

    return { rows, totalRow };
  }, [searchFilteredBookings]);

  // Package-level breakdown for Tour Packages
  const tourPackageStats = useMemo(() => {
    const targetType = appliedFilters.activeType === 'ALL' ? 'Tour Packages' : appliedFilters.activeType;
    return getCategoryPackageStats(searchFilteredBookings, targetType);
  }, [searchFilteredBookings, appliedFilters.activeType]);

  // Specific TukTrip breakdown for report preview
  const tuktripStats = useMemo(() => {
    return getCategoryPackageStats(searchFilteredBookings, 'TukTrip');
  }, [searchFilteredBookings]);

  // Car Rental breakdown
  const carRentalStats = useMemo(() => {
    const carBookings = searchFilteredBookings.filter((b) => getBookingType(b) === 'Car Rental');

    const map = new Map();
    carBookings.forEach((b) => {
      const name = b.packageName || 'Vehicle';
      const days = getRentalDays(b);
      if (!map.has(name)) {
        map.set(name, {
          vehicleName: name,
          rentalsCount: 0,
          totalRentalDays: 0,
          totalSales: 0,
          rates: [],
        });
      }
      const item = map.get(name);
      item.rentalsCount += 1;
      item.totalRentalDays += days;
      if (isRecognizedSale(b.status)) {
        item.totalSales += (Number(b.totalPrice) || 0);
      }
      const rate = b.dailyRate || b.price || (b.totalPrice && days ? Number(b.totalPrice) / days : 0);
      if (rate) {
        item.rates.push(Number(rate));
      }
    });

    const rows = Array.from(map.values()).map((car) => {
      const rentalRate = car.rates.length > 0
        ? car.rates.reduce((a, b) => a + b, 0) / car.rates.length
        : (car.totalRentalDays > 0 ? car.totalSales / car.totalRentalDays : 0);
      return {
        vehicleName: car.vehicleName,
        rentalsCount: car.rentalsCount,
        totalRentalDays: car.totalRentalDays,
        rentalRate,
        totalSales: car.totalSales,
      };
    });

    const totalRentalsCount = rows.reduce((acc, r) => acc + r.rentalsCount, 0);
    const grandTotalRentalDays = rows.reduce((acc, r) => acc + r.totalRentalDays, 0);
    const grandTotalSales = rows.reduce((acc, r) => acc + r.totalSales, 0);
    const overallRentalRate = grandTotalRentalDays > 0 ? grandTotalSales / grandTotalRentalDays : 0;

    const totalRow = {
      vehicleName: 'TOTAL',
      rentalsCount: totalRentalsCount,
      totalRentalDays: grandTotalRentalDays,
      rentalRate: overallRentalRate,
      totalSales: grandTotalSales,
    };

    return { rows, totalRow };
  }, [searchFilteredBookings]);

  const filteredBookings = searchFilteredBookings.filter((booking) => {
    if (appliedFilters.activeType === 'ALL') return true;
    return getBookingType(booking) === appliedFilters.activeType;
  });

  const totalEarnings = filteredBookings
    .filter((booking) => isRecognizedSale(booking.status))
    .reduce((acc, booking) => acc + (Number(booking.totalPrice) || 0), 0);
  const totalBookings = filteredBookings.length;
  const confirmedCount = filteredBookings.filter((booking) => isRecognizedSale(booking.status)).length;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date();
    const formattedGenDate = currentDate.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const filenameDate = currentDate.toISOString().slice(0, 10);

    // Title & Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('RABAS TRAVEL AND TOURS', 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(2, 132, 199);
    doc.text('OFFICIAL SALES REPORT', 14, 27);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${formattedGenDate}`, 196, 27, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 31, 196, 31);

    // Parameters Grid
    const dateRangeLabel = appliedFilters.dateRange === 'Custom'
      ? `${appliedFilters.startDate || 'Start'} to ${appliedFilters.endDate || 'End'}`
      : appliedFilters.dateRange;
    const serviceLabel = appliedFilters.activeType === 'ALL' ? 'All Services' : appliedFilters.activeType;

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    doc.setFont('helvetica', 'bold');
    doc.text('Report Period:', 14, 38);
    doc.setFont('helvetica', 'normal');
    doc.text(dateRangeLabel, 40, 38);

    doc.setFont('helvetica', 'bold');
    doc.text('Selected Service:', 14, 44);
    doc.setFont('helvetica', 'normal');
    doc.text(serviceLabel, 42, 44);

    doc.setFont('helvetica', 'bold');
    doc.text('Payment Status:', 110, 38);
    doc.setFont('helvetica', 'normal');
    doc.text('Recognized Paid Sales', 138, 38);

    doc.setFont('helvetica', 'bold');
    doc.text('Payment Method:', 110, 44);
    doc.setFont('helvetica', 'normal');
    doc.text('All (GCash / Card)', 139, 44);

    // High-Level Summary Card Banner
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 49, 182, 16, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 49, 182, 16, 2, 2, 'D');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL REVENUE', 20, 54);
    doc.text('TOTAL BOOKINGS', 85, 54);
    doc.text('CONFIRMED / PAID', 145, 54);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    doc.text(`PHP ${totalEarnings.toLocaleString()}`, 20, 61);

    doc.setTextColor(15, 23, 42);
    doc.text(`${totalBookings}`, 85, 61);

    doc.setTextColor(5, 150, 105);
    doc.text(`${confirmedCount}`, 145, 61);

    let currentY = 72;

    // 1. Sales Summary Breakdown Table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Sales Summary Breakdown', 14, currentY);

    const summaryHead = [['Service', 'Number of Bookings', 'Number of Customers', 'Total Sales', '% of Total']];
    const summaryBody = serviceStats.rows.map(r => [
      r.service,
      r.bookingsCount.toString(),
      r.customersCount.toString(),
      `PHP ${r.totalSales.toLocaleString()}`,
      r.percentage
    ]);
    summaryBody.push([
      serviceStats.totalRow.service,
      serviceStats.totalRow.bookingsCount.toString(),
      serviceStats.totalRow.customersCount.toString(),
      `PHP ${serviceStats.totalRow.totalSales.toLocaleString()}`,
      serviceStats.totalRow.percentage
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: summaryHead,
      body: summaryBody,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'right', fontStyle: 'bold', textColor: [2, 132, 199] },
      },
      didParseCell: (data) => {
        if (data.row.index === summaryBody.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // 2. Tour Package Sales Table
    if (appliedFilters.activeType === 'ALL' || appliedFilters.activeType === 'Tour Packages') {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Tour Package Sales Details', 14, currentY);

      const tourHead = [['Tour Package', 'Number of Bookings', 'Number of Tourists', 'Price per Booking', 'Total Sales']];
      const tourBody = tourPackageStats.rows.map(r => [
        r.packageName,
        r.bookingsCount.toString(),
        r.touristsCount.toString(),
        `PHP ${r.pricePerBooking.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `PHP ${r.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]);
      if (tourPackageStats.rows.length > 0) {
        tourBody.push([
          tourPackageStats.totalRow.packageName,
          tourPackageStats.totalRow.bookingsCount.toString(),
          tourPackageStats.totalRow.touristsCount.toString(),
          `PHP ${tourPackageStats.totalRow.pricePerBooking.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `PHP ${tourPackageStats.totalRow.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);
      } else {
        tourBody.push(['No matching tour package records', '-', '-', '-', '-']);
      }

      autoTable(doc, {
        startY: currentY + 3,
        head: tourHead,
        body: tourBody,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
          if (tourPackageStats.rows.length > 0 && data.row.index === tourBody.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
          }
        }
      });

      currentY = doc.lastAutoTable.finalY + 10;
    }

    // 3. TukTrip Sales Table
    if (appliedFilters.activeType === 'ALL' || appliedFilters.activeType === 'TukTrip') {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('TukTrip Sales Details', 14, currentY);

      const tukHead = [['TukTrip Package', 'Number of Bookings', 'Number of Tourists', 'Price per Booking', 'Total Sales']];
      const tukBody = tuktripStats.rows.map(r => [
        r.packageName,
        r.bookingsCount.toString(),
        r.touristsCount.toString(),
        `PHP ${r.pricePerBooking.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `PHP ${r.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]);
      if (tuktripStats.rows.length > 0) {
        tukBody.push([
          tuktripStats.totalRow.packageName,
          tuktripStats.totalRow.bookingsCount.toString(),
          tuktripStats.totalRow.touristsCount.toString(),
          `PHP ${tuktripStats.totalRow.pricePerBooking.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `PHP ${tuktripStats.totalRow.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);
      } else {
        tukBody.push(['No matching TukTrip records', '-', '-', '-', '-']);
      }

      autoTable(doc, {
        startY: currentY + 3,
        head: tukHead,
        body: tukBody,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
          if (tuktripStats.rows.length > 0 && data.row.index === tukBody.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
          }
        }
      });

      currentY = doc.lastAutoTable.finalY + 10;
    }

    // 4. Car Rental Sales Table
    if (appliedFilters.activeType === 'ALL' || appliedFilters.activeType === 'Car Rental') {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Car Rental Sales Details', 14, currentY);

      const carHead = [['Vehicle', 'Number of Rentals', 'Total Rental Days', 'Rental Rate', 'Total Sales']];
      const carBody = carRentalStats.rows.map(r => [
        r.vehicleName,
        r.rentalsCount.toString(),
        r.totalRentalDays.toString(),
        `PHP ${r.rentalRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `PHP ${r.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]);
      if (carRentalStats.rows.length > 0) {
        carBody.push([
          carRentalStats.totalRow.vehicleName,
          carRentalStats.totalRow.rentalsCount.toString(),
          carRentalStats.totalRow.totalRentalDays.toString(),
          `PHP ${carRentalStats.totalRow.rentalRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `PHP ${carRentalStats.totalRow.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);
      } else {
        carBody.push(['No matching car rental records', '-', '-', '-', '-']);
      }

      autoTable(doc, {
        startY: currentY + 3,
        head: carHead,
        body: carBody,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
          if (carRentalStats.rows.length > 0 && data.row.index === carBody.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
          }
        }
      });
    }

    // Footer Page Numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`RABAS Travel and Tours - Sales Report | Page ${i} of ${totalPages}`, 105, 287, { align: 'center' });
    }

    doc.save(`RABAS-Sales-Report-${filenameDate}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      {/* Print Specific CSS Rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-sales-report, #printable-sales-report * {
            visibility: visible !important;
          }
          #printable-sales-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          #printable-sales-report h1,
          #printable-sales-report h2,
          #printable-sales-report h3,
          #printable-sales-report p,
          #printable-sales-report span,
          #printable-sales-report td,
          #printable-sales-report th,
          #printable-sales-report div {
            color: #0f172a !important;
            text-shadow: none !important;
          }
          #printable-sales-report table {
            border: 1px solid #cbd5e1 !important;
            border-collapse: collapse !important;
            width: 100% !important;
          }
          #printable-sales-report th,
          #printable-sales-report td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px 12px !important;
            color: #0f172a !important;
          }
          #printable-sales-report th {
            background-color: #f1f5f9 !important;
            font-weight: 700 !important;
          }
          #printable-sales-report tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Filter & Actions Toolbar */}
      <div className="bg-white border border-[#e0dbd0] p-4 rounded-md shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service</span>
              <select
                value={activeType}
                onChange={(e) => setActiveType(e.target.value)}
                className="bg-white border border-[#d6cfc2] hover:border-[#b0a68e] focus:border-[#1a1a1a] rounded-sm text-xs text-[#1a1a1a] px-2.5 py-1.5 outline-none transition-colors cursor-pointer"
              >
                <option value="ALL">All Services</option>
                <option value="Tour Packages">Tour Packages</option>
                <option value="TukTrip">TukTrip</option>
                <option value="Car Rental">Car Rental</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Period</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-white border border-[#d6cfc2] hover:border-[#b0a68e] focus:border-[#1a1a1a] rounded-sm text-xs text-[#1a1a1a] px-2.5 py-1.5 outline-none transition-colors cursor-pointer"
              >
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Year">This Year</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {dateRange === 'Custom' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-[#d6cfc2] focus:border-[#1a1a1a] rounded-sm text-xs text-[#1a1a1a] px-2 py-1 outline-none cursor-pointer"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-[#d6cfc2] focus:border-[#1a1a1a] rounded-sm text-xs text-[#1a1a1a] px-2 py-1 outline-none cursor-pointer"
                />
              </div>
            )}

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={handleApplyFilters}
                className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#333333] text-white text-xs font-medium px-3 py-1.5 rounded-sm transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Apply
              </button>
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 bg-white hover:bg-[#f7f4ef] border border-[#d6cfc2] text-[#4a453b] hover:text-[#1a1a1a] text-xs font-medium px-2.5 py-1.5 rounded-sm transition-colors cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Right: Search & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="h-3.5 w-3.5 text-[#8a8275] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
                className="w-full bg-white border border-[#d6cfc2] focus:border-[#1a1a1a] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#1a1a1a] placeholder:text-[#8a8275] outline-none transition-colors"
              />
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 bg-white hover:bg-[#f7f4ef] border border-[#d6cfc2] hover:border-[#b0a68e] text-[#1a1a1a] text-xs font-medium px-3 py-1.5 rounded-sm transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#6b6255]" />
              Preview Report
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 bg-white hover:bg-[#f7f4ef] border border-[#1a1a1a] text-[#1a1a1a] text-xs font-semibold px-3 py-1.5 rounded-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Sales</span>
            <DollarSign className="h-4 w-4 text-[#1a1a1a]" />
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">
            PHP {totalEarnings.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Recognized paid revenue
          </span>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Bookings</span>
            <ReceiptText className="h-4 w-4 text-[#1a1a1a]" />
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{totalBookings}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Filtered bookings count
          </span>
        </div>

        <div className="bg-white border border-[#e0dbd0] p-5 rounded-md transition-colors hover:border-[#b0a68e] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confirmed</span>
            <CheckCircle2 className="h-4 w-4 text-[#1a1a1a]" />
          </div>
          <p className="text-2xl font-bold font-display text-[#1a1a1a] mt-2">{confirmedCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Completed & verified transactions
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-[#e0dbd0] rounded-md overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          {appliedFilters.activeType === 'ALL' ? (
            /* Services Breakdown Table for ALL */
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e2bd4f] bg-[#f5d061] text-[10px] uppercase tracking-[0.15em] text-[#1a1a1a] font-bold">
                  <th className="px-5 py-3.5">Service</th>
                  <th className="px-5 py-3.5 text-center">Bookings</th>
                  <th className="px-5 py-3.5 text-center">Customers</th>
                  <th className="px-5 py-3.5 text-right">Total Sales</th>
                  <th className="px-5 py-3.5 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eae5db] text-[#1a1a1a]">
                {serviceStats.rows.map((row) => (
                  <tr key={row.service} className="hover:bg-[#faf9f6]/70 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-[#1a1a1a]">{row.service}</td>
                    <td className="px-5 py-3.5 text-center font-medium text-[#4a453b]">{row.bookingsCount}</td>
                    <td className="px-5 py-3.5 text-center font-medium text-[#4a453b]">{row.customersCount}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-[#1a1a1a]">PHP {row.totalSales.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-[#6b6255]">{row.percentage}</td>
                  </tr>
                ))}
                <tr className="bg-[#faf9f6] font-bold border-t-2 border-[#eae5db] text-[#1a1a1a]">
                  <td className="px-5 py-3.5 font-bold uppercase tracking-wider text-[#1a1a1a]">{serviceStats.totalRow.service}</td>
                  <td className="px-5 py-3.5 text-center font-bold text-[#1a1a1a]">{serviceStats.totalRow.bookingsCount}</td>
                  <td className="px-5 py-3.5 text-center font-bold text-[#1a1a1a]">{serviceStats.totalRow.customersCount}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-[#1a1a1a]">PHP {serviceStats.totalRow.totalSales.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-[#1a1a1a]">{serviceStats.totalRow.percentage}</td>
                </tr>
              </tbody>
            </table>
          ) : appliedFilters.activeType === 'Car Rental' ? (
            /* Car Rental Table */
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e2bd4f] bg-[#f5d061] text-[10px] uppercase tracking-[0.15em] text-[#1a1a1a] font-bold">
                  <th className="px-5 py-3.5">Vehicle</th>
                  <th className="px-5 py-3.5 text-center">Rentals</th>
                  <th className="px-5 py-3.5 text-center">Rental Days</th>
                  <th className="px-5 py-3.5 text-right">Daily Rate</th>
                  <th className="px-5 py-3.5 text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eae5db] text-[#1a1a1a]">
                {carRentalStats.rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 italic">No car rental records found for the selected period.</td>
                  </tr>
                ) : (
                  carRentalStats.rows.map((row) => (
                    <tr key={row.vehicleName} className="hover:bg-[#faf9f6]/70 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-[#1a1a1a]">{row.vehicleName}</td>
                      <td className="px-5 py-3.5 text-center font-medium text-[#4a453b]">{row.rentalsCount}</td>
                      <td className="px-5 py-3.5 text-center font-medium text-[#4a453b]">{row.totalRentalDays}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-[#4a453b]">
                        PHP {row.rentalRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-[#1a1a1a]">
                        PHP {row.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
                {carRentalStats.rows.length > 0 && (
                  <tr className="bg-[#faf9f6] font-bold border-t-2 border-[#eae5db] text-[#1a1a1a]">
                    <td className="px-5 py-3.5 font-bold uppercase tracking-wider text-[#1a1a1a]">{carRentalStats.totalRow.vehicleName}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-[#1a1a1a]">{carRentalStats.totalRow.rentalsCount}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-[#1a1a1a]">{carRentalStats.totalRow.totalRentalDays}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#1a1a1a]">
                      PHP {carRentalStats.totalRow.rentalRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#1a1a1a]">
                      PHP {carRentalStats.totalRow.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* Tour Packages / TukTrip Table */
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#e2bd4f] bg-[#f5d061] text-[10px] uppercase tracking-[0.15em] text-[#1a1a1a] font-bold">
                  <th className="px-5 py-3.5">
                    {appliedFilters.activeType === 'Tour Packages' ? 'Tour Package' : 'TukTrip Package'}
                  </th>
                  <th className="px-5 py-3.5 text-center">Bookings</th>
                  <th className="px-5 py-3.5 text-center">Tourists</th>
                  <th className="px-5 py-3.5 text-right">Price per Booking</th>
                  <th className="px-5 py-3.5 text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eae5db] text-[#1a1a1a]">
                {tourPackageStats.rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 italic">No package records found for the selected period.</td>
                  </tr>
                ) : (
                  tourPackageStats.rows.map((row) => (
                    <tr key={row.packageName} className="hover:bg-[#faf9f6]/70 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-[#1a1a1a]">{row.packageName}</td>
                      <td className="px-5 py-3.5 text-center font-medium text-[#4a453b]">{row.bookingsCount}</td>
                      <td className="px-5 py-3.5 text-center font-medium text-[#4a453b]">{row.touristsCount}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-[#4a453b]">
                        PHP {row.pricePerBooking.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-[#1a1a1a]">
                        PHP {row.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
                {tourPackageStats.rows.length > 0 && (
                  <tr className="bg-[#faf9f6] font-bold border-t-2 border-[#eae5db] text-[#1a1a1a]">
                    <td className="px-5 py-3.5 font-bold uppercase tracking-wider text-[#1a1a1a]">{tourPackageStats.totalRow.packageName}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-[#1a1a1a]">{tourPackageStats.totalRow.bookingsCount}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-[#1a1a1a]">{tourPackageStats.totalRow.touristsCount}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#1a1a1a]">
                      PHP {tourPackageStats.totalRow.pricePerBooking.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#1a1a1a]">
                      PHP {tourPackageStats.totalRow.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Formal Sales Report Preview Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#e0dbd0] w-full max-w-4xl rounded-md shadow-2xl overflow-hidden my-8 text-[#1a1a1a]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#eae5db] bg-[#faf9f6]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#4a453b]" />
                <h2 className="font-bold text-[#1a1a1a] text-sm">Formal Sales Report Preview</h2>
              </div>
<<<<<<< HEAD
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 bg-white hover:bg-[#f7f4ef] border border-[#1a1a1a] text-[#1a1a1a] font-semibold text-xs px-3 py-1.5 rounded-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#333333] text-white font-medium text-xs px-3 py-1.5 rounded-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-[#6b6255] hover:text-[#1a1a1a] p-1 rounded transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
=======
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer no-print"
              >
                <X className="w-5 h-5" />
              </button>
>>>>>>> a28108049097633fa84c7f88bc7006d5b07063d8
            </div>

            {/* Printable Report Document Container */}
            <div id="printable-sales-report" className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto bg-white">
              {/* Document Header */}
              <div className="border-b border-[#eae5db] pb-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#1a1a1a] uppercase">RABAS Travel and Tours</h1>
                    <p className="text-xs text-[#8a8275] font-semibold tracking-wider uppercase mt-0.5">Official Sales Report</p>
                  </div>
                  <div className="text-right text-xs text-[#6b6255]">
                    <div><span className="font-semibold text-[#1a1a1a]">Date Generated:</span> {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  </div>
                </div>

                {/* Filter Parameters Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 p-3.5 rounded-sm bg-[#faf9f6] border border-[#eae5db] text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Report Period</span>
                    <span className="font-semibold text-[#1a1a1a]">
                      {appliedFilters.dateRange === 'Custom'
                        ? `${appliedFilters.startDate || 'Start'} to ${appliedFilters.endDate || 'End'}`
                        : appliedFilters.dateRange}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Selected Service</span>
                    <span className="font-semibold text-[#1a1a1a]">{appliedFilters.activeType === 'ALL' ? 'All Services' : appliedFilters.activeType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Status</span>
                    <span className="font-semibold text-emerald-600">Recognized Paid Sales</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Method</span>
                    <span className="font-semibold text-[#1a1a1a]">All (GCash / Card)</span>
                  </div>
                </div>
              </div>

              {/* High-level Sales Summary Banner */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3.5 rounded-sm bg-[#faf9f6] border border-[#eae5db]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Sales Revenue</span>
                  <div className="text-lg font-bold text-[#1a1a1a] mt-1">PHP {totalEarnings.toLocaleString()}</div>
                </div>
                <div className="p-3.5 rounded-sm bg-[#faf9f6] border border-[#eae5db]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Bookings</span>
                  <div className="text-lg font-bold text-[#1a1a1a] mt-1">{totalBookings}</div>
                </div>
                <div className="p-3.5 rounded-sm bg-[#faf9f6] border border-[#eae5db]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Confirmed / Paid</span>
                  <div className="text-lg font-bold text-emerald-600 mt-1">{confirmedCount}</div>
                </div>
              </div>

              {/* Sales Summary Breakdown */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b6255]">Sales Summary Breakdown</h3>
                <div className="border border-[#eae5db] rounded-sm overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f5d061] border-b border-[#e2bd4f] text-[#1a1a1a] font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-3">Service</th>
                        <th className="p-3 text-center">Bookings</th>
                        <th className="p-3 text-center">Customers</th>
                        <th className="p-3 text-right">Total Sales</th>
                        <th className="p-3 text-right">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eae5db] text-[#1a1a1a]">
                      {serviceStats.rows.map((row) => (
                        <tr key={row.service}>
                          <td className="p-3 font-semibold text-[#1a1a1a]">{row.service}</td>
                          <td className="p-3 text-center font-medium text-[#4a453b]">{row.bookingsCount}</td>
                          <td className="p-3 text-center font-medium text-[#4a453b]">{row.customersCount}</td>
                          <td className="p-3 text-right font-medium text-[#1a1a1a]">PHP {row.totalSales.toLocaleString()}</td>
                          <td className="p-3 text-right font-medium text-[#6b6255]">{row.percentage}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#faf9f6] font-bold text-[#1a1a1a] border-t border-[#eae5db]">
                        <td className="p-3 font-bold uppercase tracking-wider">{serviceStats.totalRow.service}</td>
                        <td className="p-3 text-center">{serviceStats.totalRow.bookingsCount}</td>
                        <td className="p-3 text-center">{serviceStats.totalRow.customersCount}</td>
                        <td className="p-3 text-right">PHP {serviceStats.totalRow.totalSales.toLocaleString()}</td>
                        <td className="p-3 text-right">{serviceStats.totalRow.percentage}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tour Packages Detail */}
              {(appliedFilters.activeType === 'ALL' || appliedFilters.activeType === 'Tour Packages') && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b6255]">Tour Package Sales</h3>
                  <div className="border border-[#eae5db] rounded-sm overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f5d061] border-b border-[#e2bd4f] text-[#1a1a1a] font-bold uppercase text-[10px] tracking-wider">
                          <th className="p-3">Tour Package</th>
                          <th className="p-3 text-center">Bookings</th>
                          <th className="p-3 text-center">Tourists</th>
                          <th className="p-3 text-right">Price per Booking</th>
                          <th className="p-3 text-right">Total Sales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eae5db] text-[#1a1a1a]">
                        {tourPackageStats.rows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400 italic">No matching tour package records.</td>
                          </tr>
                        ) : (
                          tourPackageStats.rows.map((row) => (
                            <tr key={row.packageName}>
                              <td className="p-3 font-semibold text-[#1a1a1a]">{row.packageName}</td>
                              <td className="p-3 text-center font-medium text-[#4a453b]">{row.bookingsCount}</td>
                              <td className="p-3 text-center font-medium text-[#4a453b]">{row.touristsCount}</td>
                              <td className="p-3 text-right font-medium text-[#4a453b]">
                                PHP {row.pricePerBooking.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-right font-medium text-[#1a1a1a]">
                                PHP {row.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                        {tourPackageStats.rows.length > 0 && (
                          <tr className="bg-[#faf9f6] font-bold text-[#1a1a1a] border-t border-[#eae5db]">
                            <td className="p-3 font-bold uppercase tracking-wider">{tourPackageStats.totalRow.packageName}</td>
                            <td className="p-3 text-center">{tourPackageStats.totalRow.bookingsCount}</td>
                            <td className="p-3 text-center">{tourPackageStats.totalRow.touristsCount}</td>
                            <td className="p-3 text-right">
                              PHP {tourPackageStats.totalRow.pricePerBooking.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right">
                              PHP {tourPackageStats.totalRow.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TukTrip Detail */}
              {(appliedFilters.activeType === 'ALL' || appliedFilters.activeType === 'TukTrip') && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b6255]">TukTrip Sales</h3>
                  <div className="border border-[#eae5db] rounded-sm overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f5d061] border-b border-[#e2bd4f] text-[#1a1a1a] font-bold uppercase text-[10px] tracking-wider">
                          <th className="p-3">TukTrip Package</th>
                          <th className="p-3 text-center">Bookings</th>
                          <th className="p-3 text-center">Tourists</th>
                          <th className="p-3 text-right">Price per Booking</th>
                          <th className="p-3 text-right">Total Sales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eae5db] text-[#1a1a1a]">
                        {tuktripStats.rows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400 italic">No matching TukTrip records.</td>
                          </tr>
                        ) : (
                          tuktripStats.rows.map((row) => (
                            <tr key={row.packageName}>
                              <td className="p-3 font-semibold text-[#1a1a1a]">{row.packageName}</td>
                              <td className="p-3 text-center font-medium text-[#4a453b]">{row.bookingsCount}</td>
                              <td className="p-3 text-center font-medium text-[#4a453b]">{row.touristsCount}</td>
                              <td className="p-3 text-right font-medium text-[#4a453b]">
                                PHP {row.pricePerBooking.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-right font-medium text-[#1a1a1a]">
                                PHP {row.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                        {tuktripStats.rows.length > 0 && (
                          <tr className="bg-[#faf9f6] font-bold text-[#1a1a1a] border-t border-[#eae5db]">
                            <td className="p-3 font-bold uppercase tracking-wider">{tuktripStats.totalRow.packageName}</td>
                            <td className="p-3 text-center">{tuktripStats.totalRow.bookingsCount}</td>
                            <td className="p-3 text-center">{tuktripStats.totalRow.touristsCount}</td>
                            <td className="p-3 text-right">
                              PHP {tuktripStats.totalRow.pricePerBooking.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right">
                              PHP {tuktripStats.totalRow.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Car Rental Detail */}
              {(appliedFilters.activeType === 'ALL' || appliedFilters.activeType === 'Car Rental') && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b6255]">Car Rental Sales</h3>
                  <div className="border border-[#eae5db] rounded-sm overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#f5d061] border-b border-[#e2bd4f] text-[#1a1a1a] font-bold uppercase text-[10px] tracking-wider">
                          <th className="p-3">Vehicle</th>
                          <th className="p-3 text-center">Rentals</th>
                          <th className="p-3 text-center">Rental Days</th>
                          <th className="p-3 text-right">Rental Rate</th>
                          <th className="p-3 text-right">Total Sales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eae5db] text-[#1a1a1a]">
                        {carRentalStats.rows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400 italic">No matching car rental records.</td>
                          </tr>
                        ) : (
                          carRentalStats.rows.map((row) => (
                            <tr key={row.vehicleName}>
                              <td className="p-3 font-semibold text-[#1a1a1a]">{row.vehicleName}</td>
                              <td className="p-3 text-center font-medium text-[#4a453b]">{row.rentalsCount}</td>
                              <td className="p-3 text-center font-medium text-[#4a453b]">{row.totalRentalDays}</td>
                              <td className="p-3 text-right font-medium text-[#4a453b]">
                                PHP {row.rentalRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-right font-medium text-[#1a1a1a]">
                                PHP {row.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                        {carRentalStats.rows.length > 0 && (
                          <tr className="bg-[#faf9f6] font-bold text-[#1a1a1a] border-t border-[#eae5db]">
                            <td className="p-3 font-bold uppercase tracking-wider">{carRentalStats.totalRow.vehicleName}</td>
                            <td className="p-3 text-center">{carRentalStats.totalRow.rentalsCount}</td>
                            <td className="p-3 text-center">{carRentalStats.totalRow.totalRentalDays}</td>
                            <td className="p-3 text-right">
                              PHP {carRentalStats.totalRow.rentalRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right">
                              PHP {carRentalStats.totalRow.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Bar */}
            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-[#eae5db] bg-[#faf9f6] no-print">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 bg-white hover:bg-[#f7f4ef] border border-[#1a1a1a] text-[#1a1a1a] font-semibold text-xs px-3.5 py-1.5 rounded-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#333333] text-white font-medium text-xs px-3.5 py-1.5 rounded-sm transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Report
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="bg-white hover:bg-[#f7f4ef] border border-[#d6cfc2] text-[#4a453b] hover:text-[#1a1a1a] font-medium text-xs px-3.5 py-1.5 rounded-sm transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReports;
