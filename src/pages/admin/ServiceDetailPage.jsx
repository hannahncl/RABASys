import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Package, Users, Loader } from 'lucide-react';
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

const ServiceDetailPage = () => {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadService = async () => {
      setLoading(true);
      try {
        const data = await serviceService.getByCategory(category || 'tour');
        const selected = data.find((item) => String(item.id) === String(id));
        setService(selected || null);
      } catch {
        setService(null);
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [category, id]);

  const itinerary = useMemo(() => parseDetailList(service?.itinerary), [service]);
  const inclusions = useMemo(() => parseDetailList(service?.inclusions), [service]);
  const tags = useMemo(() => {
    if (Array.isArray(service?.tags)) return service.tags;
    if (typeof service?.tags === 'string') {
      return service.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    }
    return [];
  }, [service]);

  const title = service?.packageName || service?.title || 'Service Details';
  const description = service?.description || 'No description available for this service.';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center">
        <p className="text-sm text-slate-400">We could not find the selected service.</p>
        <button
          onClick={() => navigate('/admin/services')}
          className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/admin/services')}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Service Management
        </button>

        <button
          onClick={() => {
            if (category === 'car') {
              navigate(`/admin/services/edit-car-rental/${service.id}`);
            } else {
              navigate(`/admin/services/edit-tour-package/${service.id}`);
            }
          }}
          className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
        >
          Edit Service
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            {service.image ? (
              <img src={service.image} alt={title} className="h-72 w-full object-cover" />
            ) : (
              <div className="flex h-72 items-center justify-center bg-slate-800/70">
                <Package className="h-16 w-16 text-cyan-400/40" />
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400">Service Preview</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-100">{title}</h1>
          </div>

          <p className="text-sm leading-7 text-slate-300">{description}</p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Overview</p>
              <span className="text-xl font-bold text-slate-100">PHP {Number(service.price || 0).toLocaleString()}</span>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-400">
              {service.destination && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  <span>{service.destination}</span>
                </div>
              )}
              {service.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>{service.duration}</span>
                </div>
              )}
              {(service.maximumCapacity || service.capacity) && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <span>Capacity: {service.maximumCapacity || service.capacity}</span>
                </div>
              )}
              {service.meetingLocation && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-cyan-400" />
                  <span>Meeting point: {service.meetingLocation}</span>
                </div>
              )}
            </div>
          </div>

          {itinerary.length > 0 && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-slate-500">Itinerary</p>
              <ul className="space-y-2 text-sm text-slate-300">
                {itinerary.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {inclusions.length > 0 && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-slate-500">Inclusions</p>
              <ul className="space-y-2 text-sm text-slate-300">
                {inclusions.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
