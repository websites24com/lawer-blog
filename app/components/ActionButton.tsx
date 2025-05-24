'use client';

type Props = {
  onClick: () => void;
  loading?: boolean;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
  className?: string;
};

export default function ActionButton({
  onClick,
  loading = false,
  children,
  title,
  className = '',
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={title}
      className={className}
    >
      {children}
    </button>
  );
}
