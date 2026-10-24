import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { wishlistService } from '../../services/api';

const Wishlist = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setItems(await wishlistService.getAll());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  const removeItem = async (item) => {
    await wishlistService.remove(item.item_type, item.item_id);
    setItems((current) => current.filter((entry) => entry.wishlist_id !== item.wishlist_id));
    window.dispatchEvent(new Event('rabas-wishlist-changed'));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white px-6 py-24 text-center text-[#4a453b]">
        <Heart className="mx-auto mb-5 h-10 w-10 text-[#603524]" />
        <h1 className="text-xl font-semibold text-[#1a1a1a]">Sign in to view your wishlist</h1>
        <button onClick={() => navigate('/login')} className="mt-6 rounded-full bg-[#603524] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">Sign In</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-12 text-[#2d2a24] sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-end justify-between border-b border-[#e8e2d8] pb-5">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.035em] text-[#294136]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Wishlist</h1>
          </div>
          <span className="text-xs text-[#6b6255]">{items.length} saved item{items.length === 1 ? '' : 's'}</span>
        </div>

        {loading ? <p className="py-20 text-center text-sm text-[#6b6255]">Loading your wishlist...</p> : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d6cfc2] px-6 py-20 text-center">
            <Heart className="mx-auto mb-4 h-8 w-8 text-[#b9ad9d]" />
            <p className="text-sm text-[#6b6255]">Tap the heart on a tour package, vehicle, or destination to save it here.</p>
            <Link to="/packages" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#603524]">Browse packages <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const isTour = item.item_type === 'tour';
              const target = isTour ? `/packages/${item.item_id}` : item.item_type === 'vehicle' ? `/car-rentals/${item.item_id}` : '/explore';
              return (
                <div key={item.wishlist_id} className="group overflow-hidden rounded-xl border border-[#e7e2d8] bg-white shadow-sm transition hover:shadow-md">
                  {/* Image Container with Top-Right Shaded Heart */}
                  <div className="relative h-44 w-full overflow-hidden bg-[#faf9f6]">
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      aria-label="Remove from wishlist"
                      title="Remove from wishlist"
                      className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#e0dbd0] bg-white/95 shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <Heart className="h-4 w-4 fill-[#8b2e2e] text-[#8b2e2e] stroke-[1.8]" />
                    </button>
                    {item.item_image ? (
                      <img
                        src={item.item_image}
                        alt={item.item_name || item.item_type}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#faf9f6]">
                        <Heart className="h-9 w-9 text-[#b9ad9d]" />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b7355]">{item.item_type}</p>
                    <h2 className="mt-1 truncate font-semibold text-[#1a1a1a]">{item.item_name || `Saved ${item.item_type} #${item.item_id}`}</h2>
                    <div className="mt-4 flex items-center justify-between">
                      <Link to={target} className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#603524] hover:text-[#8b7355] transition-colors">
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
