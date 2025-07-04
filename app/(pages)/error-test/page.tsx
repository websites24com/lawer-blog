// ✅ This is a server component that deliberately throws
export default function ErrorTestPage() {
  // Force an error when this page is visited
  throw new Error('🧨 This is a test error to trigger app/error.tsx');
}
