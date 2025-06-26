'use client';

import { useEffect, useState } from 'react';

type Props = {
  onSuccess: (lat: number, lon: number) => void;
  onError: () => void;
};

export default function GeoLocationChecker({ onSuccess, onError }: Props) {
  const [locationAllowed, setLocationAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setLocationAllowed(false);
      onError(); // ✅ Call onError if not supported
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log('📍 Location granted:', position.coords);
        setLocationAllowed(true);

        // ✅ FIX: Call the onSuccess callback
        onSuccess(lat, lon);
      },
      (error) => {
        console.warn('⚠️ Geolocation error:', error.message);
        alert('Enable geolocation to see bikes near your location.');
        setLocationAllowed(false);

        // ✅ FIX: Call the onError callback
        onError();
      }
    );
  }, [onSuccess, onError]);

  return null;
}