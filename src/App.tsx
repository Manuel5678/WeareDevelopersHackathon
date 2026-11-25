/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ErrorBoundary } from './components/ErrorBoundary';
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';

function AppShell() {
  const { user, authReady, signInWithGoogle, logout } = useFirebase();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Flagsmith Experiment Lab</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Firebase Authentication and Firestore are configured. Once you confirm what you want to
          test, what counts as success, and your Flagsmith environment, we will wire up the A/B
          experiment here.
        </p>

        <div className="mt-6 pt-6 border-t border-neutral-100 flex items-center justify-between gap-4">
          {!authReady ? (
            <span className="text-sm text-neutral-500">Loading session...</span>
          ) : user ? (
            <>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {user.displayName || 'Signed in user'}
                </p>
                <p className="text-xs text-neutral-500 truncate">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="px-4 py-2 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="px-4 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <AppShell />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
