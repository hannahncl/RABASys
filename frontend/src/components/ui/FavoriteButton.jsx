import React, { useContext, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

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

  useEffect(() => {
    setIsFavorite(readFavorites(user).includes(favoriteId));
  }, [user, favoriteId]);

  const toggleFavorite = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const favorites = readFavorites(user);
    const nextFavorites = favorites.includes(favoriteId)
      ? favorites.filter((id) => id !== favoriteId)
      : [...favorites, favoriteId];
    localStorage.setItem(getStorageKey(user), JSON.stringify(nextFavorites));
    setIsFavorite(nextFavorites.includes(favoriteId));
  };

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${className}`}
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
