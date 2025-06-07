'use client'

type Props = {
phone: string | null | undefined;
}

export function RenderPhone ({phone} : Props){
    if (!phone) return '—';
    const formatted = phone.startsWith('+') ? phone : `+${phone}`;
    return (
      <a href={`tel:${formatted}`} target="_blank" rel="noopener noreferrer">
        {formatted}
      </a>
    );

    
  };