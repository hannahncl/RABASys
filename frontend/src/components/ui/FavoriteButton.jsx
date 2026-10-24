import React, { useContext, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { wishlistService } from '../../services/api';

const getStorageKey = (user) => `rabas_favorites_${user?.id || user?.account_id || user?.email || 'guest'}`;

const readFavorites = (user) => {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey(user)) || '[]');
  } catch {
    return [];
  }
};

const FavoriteButton = ({ itemId, itemType, className = '', style = {} }) => {
  const { user } = useContext(AuthContext);
  const favoriteId = `${itemType}:${itemId}`;
  const [isFavorite, setIsFavorite] = useState(() => readFavorites(user).includes(favoriteId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setIsFavorite(readFavorites(user).includes(favoriteId));
    if (user) {
      wishlistService.getAll()
        .then((items) => {
          if (active) setIsFavorite(items.some((item) => item.item_type === itemType && String(item.item_id) === String(itemId)));
        })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [user, favoriteId, itemId, itemType]);

  const toggleFavorite = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (saving) return;
    const favorites = readFavorites(user);
    const nextFavorites = favorites.includes(favoriteId)
      ? favorites.filter((id) => id !== favoriteId)
      : [...favorites, favoriteId];
    setSaving(true);
    try {
      if (user) {
        if (isFavorite) await wishlistService.remove(itemType, itemId);
        else await wishlistService.add(itemType, itemId);
      }
      localStorage.setItem(getStorageKey(user), JSON.stringify(nextFavorites));
      setIsFavorite(nextFavorites.includes(favoriteId));
      window.dispatchEvent(new Event('rabas-wishlist-changed'));
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${saving ? 'opacity-60' : ''} ${className}`}
      style={{
        background: 'rgba(255,255,255,0.96)',
        borderColor: '#e0dbd0',
        color: isFavorite ? '#8b2e2e' : '#4a453b',
        ...style,
      }}
    >
      <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={1.8} />
    </button>
  );
};

export default FavoriteButton;
