import React, { useState, useEffect } from 'react';
import { tripUploadService } from '../../services/tripUploadService';
import { packageService } from '../../services/packageService';
import { useNotification } from '../../hooks/useNotification';
import { FileUp, Landmark, RefreshCw, Send, CheckCircle, Image as ImageIcon } from 'lucide-react';

const MOCK_PRESET_IMAGES = [
  { name: 'Lagoon Kayaking', url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800' },
  { name: 'Beach Sunset', url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=800' },
  { name: 'Rolling Hills Scenic', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800' },
  { name: 'Surfing Swell', url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800' }
];

const TripUploads = () => {
  const [packages, setPackages] = useState([]);
  const [activeUploads, setActiveUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  // Form states
  const [selectedPkgId, setSelectedPkgId] = useState('');
  const [spotName, setSpotName] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState(MOCK_PRESET_IMAGES[0].url);

  const loadData = async () => {
    setLoading(true);
    try {
      const allPkgs = await packageService.getAll();
      setPackages(allPkgs);
      if (allPkgs.length > 0) setSelectedPkgId(allPkgs[0].id);

      const logs = await tripUploadService.getAll();
      setActiveUploads(logs);
    } catch (e) {
      showNotification('Failed to fetch data logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPkgId || !spotName || !caption || !selectedImageUrl) {
      showNotification('All fields are required.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const pkg = packages.find(p => p.id === selectedPkgId);
      await tripUploadService.upload(
        selectedPkgId,
        pkg ? pkg.title : 'General Tour',
        'Albert Guide', // Mocked active guide profile
        spotName,
        caption,
        selectedImageUrl
      );

      showNotification('Trip update posted in real-time to customer feed!', 'success');
      // Reset form
      setSpotName('');
      setCaption('');
      // Reload lists
      const logs = await tripUploadService.getAll();
      setActiveUploads(logs);
    } catch (err) {
      showNotification('Failed to upload status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Upload Form - Left 2 Cols */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-6 md:p-8 rounded-2xl border-slate-800 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold font-display text-slate-100">Live Trip Uploads</h1>
            <p className="text-slate-400 text-sm">Post real-time status updates and photos directly from the tour spots to guest dashboards.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Package selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Active Tour Package</label>
              <select
                value={selectedPkgId}
                onChange={(e) => setSelectedPkgId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/20 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none"
              >
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.destination})</option>
                ))}
              </select>
            </div>

            {/* Current Spot Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Current Landmark / Spot Name</label>
              <input
                type="text"
                required
                value={spotName}
                onChange={(e) => setSpotName(e.target.value)}
                placeholder="e.g. Big Lagoon, Marlboro Hills Lookout"
                className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/20 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none"
              />
            </div>

            {/* Caption */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Live Log Caption</label>
              <textarea
                required
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe current weather conditions, tour highlights or guest activities..."
                className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/20 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none resize-none"
              />
            </div>

            {/* Preset Images picker */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Select Tour Image Backdrop</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {MOCK_PRESET_IMAGES.map((img) => (
                  <div
                    key={img.name}
                    onClick={() => setSelectedImageUrl(img.url)}
                    className={`relative h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedImageUrl === img.url ? 'border-emerald-400 scale-[0.98]' : 'border-slate-900 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/40" />
                    <span className="absolute bottom-1.5 left-1.5 text-[8px] font-bold text-white truncate max-w-[90%]">
                      {img.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-bold font-display rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-400/10 active:scale-[0.98] transition-all"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post Real-Time Update
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* History Log - Right Col */}
      <div className="space-y-6">
        <h3 className="font-bold text-slate-200 font-display text-lg">Field Log History</h3>
        
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {activeUploads.map((up) => (
            <div key={up.id} className="glass-panel p-4 rounded-xl border-slate-900 space-y-3">
              <div className="flex items-start gap-3">
                <img src={up.imageUrl} alt={up.spotName} className="h-12 w-12 object-cover rounded-lg border border-slate-800" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-slate-200 truncate">{up.packageName}</h4>
                  <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                    {up.spotName}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 italic">"{up.caption}"</p>
              <div className="text-[9px] text-slate-500 text-right">
                {new Date(up.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TripUploads;
