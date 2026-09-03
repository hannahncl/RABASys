import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Car, Users, Fuel, Cog, Hash, Edit, Loader, Shield, CreditCard } from 'lucide-react';
import { serviceService } from '../../services/serviceService';

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-850/50 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <span className="text-xs font-semibold text-slate-200">{value}</span>
    </div>
  );
};

const CarRentalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVehicle = async () => {
      setLoading(true);
      try {
        const data = await serviceService.getByCategory('car');
        const found = data.find((v) => String(v.id) === String(id));
        setVehicle(found || null);
      } catch {
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    };
    loadVehicle();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="max-w-md mx-auto rounded-3xl border border-slate-850 bg-slate-900/30 p-8 text-center space-y-4">
        <p className="text-sm text-slate-400">Vehicle details not found.</p>
        <button
          onClick={() => navigate('/admin/car-rentals')}
          className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-white transition-all cursor-pointer"
        >
          Back to Car Rentals
        </button>
      </div>
    );
  }

  const title = vehicle.vehicleName || vehicle.vehicle_name || vehicle.title || 'Untitled Vehicle';

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Action Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/car-rentals')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Car Rentals
        </button>
        <button
          onClick={() => navigate(`/admin/car-rentals/edit/${vehicle.id}`)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-white text-slate-950 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm"
        >
          <Edit className="h-4 w-4" /> Edit Vehicle
        </button>
      </div>

      {/* 50 / 50 Split Card */}
      <div className="bg-slate-900/30 border border-slate-850 backdrop-blur-md rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Half (50%): Image Top + Title & Daily Rate Underneath */}
        <div className="bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-850/60 p-6 flex flex-col justify-between space-y-6">
          
          {/* Vehicle Image */}
          <div className="relative min-h-[220px] md:min-h-[260px] bg-slate-900/60 rounded-2xl p-4 flex items-center justify-center border border-slate-850/40 overflow-hidden">
            {vehicle.image && vehicle.image !== '/CAGSAWA.jpg' ? (
              <img
                src={vehicle.image}
                alt={title}
                className="w-full h-full max-h-[280px] object-contain rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-600">
                <Car className="h-16 w-16 stroke-[1.25]" />
                <span className="text-xs text-slate-500 font-medium">No Image Provided</span>
              </div>
            )}
          </div>

          {/* Header Info under picture */}
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{title}</h1>
            <p className="text-lg font-black text-slate-200 mt-1">
              PHP {Number(vehicle.dailyRate || vehicle.daily_rate || 0).toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1.5">/ day</span>
            </p>
          </div>
        </div>

        {/* Right Half (50%): Vehicle Specifications */}
        <div className="p-6 md:p-8 flex flex-col justify-start space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-850/80 pb-3 mb-2">
            Vehicle Specifications
          </h2>

          <div className="space-y-1">
            <InfoRow icon={Car} label="Vehicle Type" value={vehicle.vehicleType || vehicle.vehicle_type} />
            <InfoRow icon={Car} label="Vehicle Brand" value={vehicle.vehicleBrand || vehicle.vehicle_brand} />
            <InfoRow icon={Hash} label="Plate Number" value={vehicle.plateNumber || vehicle.plate_number} />
            <InfoRow icon={Users} label="Capacity" value={vehicle.capacity} />
            <InfoRow icon={Fuel} label="Fuel Type" value={vehicle.fuelType || vehicle.fuel_type} />
            <InfoRow icon={Cog} label="Transmission" value={vehicle.transmission} />
            <InfoRow icon={CreditCard} label="Daily Rate" value={`PHP ${Number(vehicle.dailyRate || vehicle.daily_rate || 0).toLocaleString()} / day`} />
            <InfoRow icon={Shield} label="Availability Status" value={vehicle.availabilityStatus === 'Maintenance' ? 'Under Maintenance' : vehicle.availabilityStatus} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default CarRentalDetailPage;



