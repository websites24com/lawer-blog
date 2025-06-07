'use client';

type Props = {
  email: string | null | undefined;
};

export default function RenderEmail({ email }: Props) {
  // If the email is missing, show a dash
  if (!email) return <>—</>;

  // Otherwise render a mailto link
  return (
    <a href={`mailto:${email}`} target="_blank" rel="noopener noreferrer">
      {email}
    </a>
  );
}
