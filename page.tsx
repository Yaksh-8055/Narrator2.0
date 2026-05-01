/**
 * app/page.tsx
 *
 * Main dashboard — the root page of the app (protected by AuthGuard).
 *
 * Layout:
 *  ┌──────────────────────────────────────────────────────┐
 *  │  Navbar  [Story Narrator]   [Generate | Library]  [Logout] │
 *  ├──────────────────────────────────────────────────────┤
 *  │                                                      │
 *  │   <StoryGenerator />  or  <LibraryView />            │
 *  │   (depending on active tab)                          │
 *  │                                                      │
 *  └──────────────────────────────────────────────────────┘
 *
 * onStorySaved() increments refreshTrigger so LibraryView re-fetches
 * from Cloudant automatically when the user switches to the Library tab.
 */

'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import StoryGenerator from '@/components/StoryGenerator';
import LibraryView from '@/components/LibraryView';
import { User } from '@/types';

type Tab = 'generate' | 'library';

export default function HomePage() {
  return (
    <AuthGuard>
      {(user, onLogout) => (
        <DashboardShell
          user={user}
          onLogout={onLogout}
        />
      )}
    </AuthGuard>
  );
}

// ─── Inner shell (rendered only when authenticated) ───────────────────────────

function DashboardShell({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  // Incremented each time a story is saved → triggers LibraryView re-fetch
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleStorySaved = () => {
    setRefreshTrigger((n) => n + 1);
  };

  const displayName = user.name ?? 'there';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Brand */}
          <span className="text-base font-bold text-gray-900 tracking-tight flex-shrink-0">
            📖 Story Narrator
          </span>

          {/* Tab switcher */}
          <nav
            role="tablist"
            aria-label="Navigation"
            className="flex items-center gap-1 bg-gray-100 rounded-lg p-1"
          >
            <TabButton
              label="✨ Generate"
              active={activeTab === 'generate'}
              onClick={() => setActiveTab('generate')}
            />
            <TabButton
              label="📚 Library"
              active={activeTab === 'library'}
              onClick={() => setActiveTab('library')}
            />
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-gray-500 hidden sm:block">
              Hi, {displayName}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg
                         text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {activeTab === 'generate' ? (
          <StoryGenerator
            userId={user.id}
            onStorySaved={handleStorySaved}
          />
        ) : (
          <LibraryView
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white py-3">
        <p className="text-center text-xs text-gray-400">
          Powered by Gemini · ElevenLabs · Cloudant
        </p>
      </footer>

    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`
        px-4 py-1.5 rounded-md text-sm font-medium transition-colors
        ${
          active
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-800'
        }
      `}
    >
      {label}
    </button>
  );
}