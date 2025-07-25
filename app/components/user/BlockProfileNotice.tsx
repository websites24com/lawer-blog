import Link from 'next/link';
import ActionButton from '@/app/components/global/ActionButton';

export default function BlockedProfileNotice() {
  return (
    <div className="user-profile-container blocked-profile" style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>⛔ Profile Blocked</h1>
      <p style={{ maxWidth: '600px', margin: '1rem auto' }}>
        You’ve either blocked this user or they’ve blocked you. To view this profile, unblock them from your dashboard.
      </p>
      <div style={{ marginTop: '2rem' }}>
        <Link href="/user" passHref>
          <ActionButton as="span">🔙 Return to My Account</ActionButton>
        </Link>
      </div>
    </div>
  );
}
