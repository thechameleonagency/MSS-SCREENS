import { clearAllAppMemory } from '../lib/appVersion';

/**
 * Shown before the main app when `appVersion` in localStorage differs from `APP_VERSION`.
 * No close affordance — user must clear storage and reload.
 */
export function AppVersionBlocker() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="app-version-blocker-title"
      aria-describedby="app-version-blocker-desc"
    >
      <div className="max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg">
        <h1 id="app-version-blocker-title" className="text-lg font-semibold text-foreground">
          Update required
        </h1>
        <p id="app-version-blocker-desc" className="mt-3 text-sm text-muted-foreground">
          Please clear memory to see the latest changes.
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => {
            clearAllAppMemory();
            window.location.reload();
          }}
        >
          Clear memory &amp; reload
        </button>
      </div>
    </div>
  );
}
