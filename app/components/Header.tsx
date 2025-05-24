// app/components/Header.tsx
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="site-header">
      <div className="logo">BikeApp</div>
      <nav>
        {/* other nav links */}
        <ThemeToggle />
      </nav>
    </header>
  );
}
