import React from 'react';
import { useParams } from 'react-router-dom';
import CarRentalDetailPage from './CarRentalDetailPage';
import TourPackageDetailPage from './TourPackageDetailPage';

const ServiceDetailPage = () => {
  const { category } = useParams();
  if (category === 'car') {
    return <CarRentalDetailPage />;
  }
  return <TourPackageDetailPage />;
};

export default ServiceDetailPage;


