'use client';

import { useEffect } from 'react';

type Props = {
  formRef: React.RefObject<HTMLFormElement>;
};

export default function AutoLocationFiller({ formRef }: Props) {
  useEffect(() => {
    if (!navigator.geolocation || !formRef.current) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const latInput = formRef.current.querySelector('input[name="latitude"]') as HTMLInputElement;
        const lonInput = formRef.current.querySelector('input[name="longitude"]') as HTMLInputElement;
        const locInput = formRef.current.querySelector('input[name="location"]') as HTMLInputElement;
        const cityInput = formRef.current.querySelector('input[name="city"]') as HTMLInputElement;
        const countryInput = formRef.current.querySelector('input[name="country"]') as HTMLInputElement;

        if (latInput) latInput.value = String(lat);
        if (lonInput) lonInput.value = String(lon);
        if (locInput) locInput.value = `POINT(${lon} ${lat})`;

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const data = await res.json();

          const city = data.address.city || data.address.town || data.address.village || '';
          const country = data.address.country || '';

          if (cityInput) cityInput.value = city;
          if (countryInput) countryInput.value = country;

          console.log('✅ Filled geo inputs:', { lat, lon });
          console.log('📍 City/Country:', city, country);
        } catch (err) {
          console.error('🌍 Location fetch failed:', err);
        }
      },
      (error) => {
        console.warn('⚠️ Geolocation error:', error.message);
      }
    );
  }, [formRef]);

  return null;
}
