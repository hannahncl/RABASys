import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, Package, Edit, Loader, CheckCircle2, ListOrdered } from 'lucide-react';
import { serviceService } from '../../services/serviceService';

const parseDetailList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (typeof entry === 'object' && entry?.title) return entry.title;
        if (typeof entry === 'object' && entry?.desc) return entry.desc;
        return String(entry);
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [String(value)];
};

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

const TourPackageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPackage = async () => {
      setLoading(true);
      try {
        const data = await serviceService.getByCategory('tour');
        const found = data.find((p) => String(p.id) === String(id));
        setPkg(found || null);
      } catch {
        setPkg(null);
      } finally {
        setLoading(false);
      }
    };
    loadPackage();
  }, [id]);

  const itinerary = useMemo(() => parseDetailList(pkg?.itinerary), [pkg]);
  const inclusions = useMemo(() => parseDetailList(pkg?.inclusions), [pkg]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="max-w-md mx-auto rounded-3xl border border-slate-850 bg-slate-900/30 p-8 text-center space-y-4">
        <p className="text-sm text-slate-400">Tour package details not found.</p>
        <button
          onClick={() => navigate('/admin/tour-packages')}
          className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-white transition-all cursor-pointer"
        >
          Back to Tour Packages
        </button>
      </div>
    );
  }

  const title = pkg.packageName || pkg.package_name || pkg.title || 'Untitled Tour Package';

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Action Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/tour-packages')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tour Packages
        </button>
        <button
          onClick={() => navigate(`/admin/tour-packages/edit/${pkg.id}`)}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-white text-slate-950 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm"
        >
          <Edit className="h-4 w-4" /> Edit Package
        </button>
      </div>

      {/* 50 / 50 Split Card */}
      <div className="bg-slate-900/30 border border-slate-850 backdrop-blur-md rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Half (50%): Package Image + Title & Price */}
        <div className="bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-850/60 p-6 flex flex-col justify-between space-y-6">
          
          {/* Package Image */}
          <div className="relative min-h-[220px] md:min-h-[260px] bg-slate-900/60 rounded-2xl p-4 flex items-center justify-center border border-slate-850/40 overflow-hidden">
            {pkg.image && pkg.image !== '/CAGSAWA.jpg' ? (
              <img
                src={pkg.image}
                alt={title}
                className="w-full h-full max-h-[280px] object-contain rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-600">
                <Package className="h-16 w-16 stroke-[1.25]" />
                <span className="text-xs text-slate-500 font-medium">No Image Provided</span>
              </div>
            )}
          </div>

          {/* Title & Price under picture */}
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{title}</h1>
            <p className="text-lg font-black text-slate-200 mt-1">
              PHP {Number(pkg.price || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Right Half (50%): Package Specifications & Details */}
        <div className="p-6 md:p-8 flex flex-col justify-start space-y-6">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-850/80 pb-3 mb-2">
              Tour Specifications
            </h2>

            <div className="space-y-1">
              <InfoRow icon={MapPin} label="Destination" value={pkg.destination} />
              <InfoRow icon={Clock} label="Duration" value={pkg.duration} />
              <InfoRow icon={Users} label="Max Capacity" value={pkg.maximumCapacity || pkg.max_capacity} />
              <InfoRow icon={Package} label="Meeting Point" value={pkg.meetingLocation || pkg.meeting_location} />
            </div>
          </div>

          {/* Description */}
          {pkg.description && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-850/80 pb-2 mb-2">
                Description
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">{pkg.description}</p>
            </div>
          )}

          {/* Inclusions */}
          {inclusions.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-850/80 pb-2 mb-2">
                Inclusions
              </h2>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {inclusions.map((inc, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-750 text-xs text-slate-200 font-medium">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    {inc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Itinerary */}
          {itinerary.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-850/80 pb-3 mb-3">
                Itinerary
              </h2>
              <div className="space-y-2">
                {itinerary.map((item, index) => (
                  <div key={index} className="flex gap-2.5 text-xs text-slate-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-200">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TourPackageDetailPage;
