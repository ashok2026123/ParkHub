import React, { useState } from 'react';
import { Navigation2, Phone, Globe, Star, MapPin, Heart, Wifi, Wind, Car, Zap, Coffee, Bed, Wrench } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface Place {
  id: string | number;
  name: string;
  lat: number | string;
  lng: number | string;
  poiType: string;
  distance?: number;
  eta?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  internet_access?: string;
  air_conditioning?: string;
  parking?: string;
  ev_charging?: string;
  rooms?: string;
  stars?: string;
  [key: string]: any;
}

interface PlaceCardProps {
  place: Place;
  user: any;
  onNavigate?: (place: Place) => void;
  onClose?: () => void;
  showAlert?: (msg: string, type: string) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, user, onNavigate, onClose, showAlert }) => {
  const [isSaving, setIsSaving] = useState(false);
  
  const handleFavorite = async () => {
    if (!user) {
      if (showAlert) showAlert("Please login to save favorites", "Error");
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'favorites'), {
        userId: user.uid,
        placeId: place.id,
        placeData: place,
        timestamp: serverTimestamp()
      });
      if (showAlert) showAlert("Added to favorites!", "Success");
    } catch (e) {
      console.error(e);
      if (showAlert) showAlert("Failed to save", "Error");
    } finally {
      setIsSaving(false);
    }
  };

  const renderIcon = () => {
    switch(place.poiType) {
      case 'hotels': return <Bed size={20} />;
      case 'restaurants': return <Coffee size={20} />;
      case 'fuel': return <Zap size={20} />;
      case 'ev': return <Zap size={20} />;
      case 'mechanic': return <Wrench size={20} />;
      case 'parking': return <Car size={20} />;
      default: return <MapPin size={20} />;
    }
  };

  const getTypeLabel = () => {
    if (place.tourism) return place.tourism.replace('_', ' ').toUpperCase();
    if (place.amenity) return place.amenity.replace('_', ' ').toUpperCase();
    return place.poiType.toUpperCase();
  };

  return (
    <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'rgba(0, 230, 118, 0.1)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {renderIcon()}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#FFF' }}>{place.name || `Unnamed ${getTypeLabel()}`}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', padding: '2px 6px', background: 'rgba(0, 230, 118, 0.1)', borderRadius: '4px' }}>
                {getTypeLabel()}
              </span>
              {place.stars && (
                <span style={{ fontSize: '11px', color: '#FFD700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Star size={12} fill="#FFD700" /> {place.stars} Star
                </span>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={handleFavorite}
          disabled={isSaving}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <Heart size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        {place.distance !== undefined && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Navigation2 size={14} /> {place.distance.toFixed(1)} km</span>
        )}
        {place.eta && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>ETA: {place.eta}</span>
        )}
        {place.address && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}><MapPin size={14} /> {place.address}</span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
        {(place.internet_access === 'yes' || place.internet_access === 'wlan') && (
          <span style={{ fontSize: '11px', color: '#FFF', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Wifi size={12} /> Wi-Fi</span>
        )}
        {place.air_conditioning === 'yes' && (
          <span style={{ fontSize: '11px', color: '#FFF', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Wind size={12} /> A/C</span>
        )}
        {place.parking && (
          <span style={{ fontSize: '11px', color: '#FFF', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Car size={12} /> Parking</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button 
          onClick={() => onNavigate && onNavigate(place)}
          className="glow-button"
          style={{ padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <Navigation2 size={16} /> Navigate
        </button>
        
        {place.website ? (
          <a href={place.website} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
              <Globe size={16} /> Book / View
            </button>
          </a>
        ) : place.phone ? (
          <a href={`tel:${place.phone}`} style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
              <Phone size={16} /> Call
            </button>
          </a>
        ) : (
          <button disabled style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            No Contact Info
          </button>
        )}
      </div>
    </div>
  );
};
