// app/components/RenderWebsite.tsx
'use client';

type Props = {
  url: string | null | undefined;
};

export default function RenderWebsite({ url }: Props) {
  if (!url) return <>—</>;

  const href = url.startsWith('http') ? url : `https://${url}`;
  let display = href.replace(/^https?:\/\//, '');

  if (!display.startsWith('www.')) {
    display = 'www.' + display;
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {display}
    </a>
  );
}
