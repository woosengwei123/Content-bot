import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex w-12 h-12 rounded-lg bg-neutral-900 text-white items-center justify-center text-base font-medium mb-4">
          CB
        </div>
        <h1 className="text-2xl font-medium text-neutral-900 mb-2">ContentBot Pro</h1>
        <p className="text-neutral-500 mb-8">
          AI content generation and scoring for marketing agencies and IT brands. Manage every client&apos;s content from one workspace.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/signup"
            className="bg-neutral-900 text-white rounded-md px-5 py-2.5 text-sm font-medium hover:bg-neutral-800"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="border border-neutral-300 rounded-md px-5 py-2.5 text-sm font-medium hover:bg-neutral-100"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
