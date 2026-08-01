"use client";

/**
 * Opens the consent preferences modal.
 *
 * The plugin is imported lazily *inside the handler* rather than at module
 * scope, because this button renders in the footer of every page. A static
 * import would pull the whole consent library and its stylesheet into the
 * initial bundle just to render a text link nobody has clicked yet.
 */
export function CookieSettingsButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const CC = await import("vanilla-cookieconsent");
        CC.showPreferences();
      }}
    >
      {children}
    </button>
  );
}
