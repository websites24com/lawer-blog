'use client';

type Props = {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  disabled?: boolean; // ✅ add this line
  active?: boolean;
  children: React.ReactNode;
  title?: string;
  className?: string;
};



export default function ActionButton({
  onClick,
  type = 'button',
  loading = false,
  disabled = false, // ✅ add this default
  children,
  title,
  className = '',
}: Props) {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={loading || disabled} // ✅ combine loading and manual disabling
      title={title}
      className={className}
    >
      {children}
    </button>
  );
}

