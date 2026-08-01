"use client";

import { useState } from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

/**
 * Brand-styled select.
 *
 * A native `<select>` renders its list with the operating system's own widget,
 * which ignores every token on the page - hence the grey-on-blue list that
 * looked nothing like the rest of the form. This uses Base UI's Select, which
 * is already a dependency via shadcn, so the popup is real markup we can style.
 *
 * Base UI's root accepts `name` and `required`, and renders the hidden input
 * itself, so the value still arrives through native FormData. The server action
 * and its Zod schema are untouched.
 *
 * Keyboard behaviour, typeahead, focus trapping and the ARIA wiring come from
 * the primitive rather than being hand-rolled, which is the whole reason to use
 * it over a div-and-onClick dropdown.
 */
export function FormSelect({
  id,
  name,
  placeholder,
  options,
  defaultValue,
  invalid,
  describedBy,
  className,
}: {
  id: string;
  name: string;
  placeholder: string;
  options: SelectOption[];
  /** Seeds the initial choice. Read once, on mount. */
  defaultValue?: string;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}) {
  /**
   * Controlled, unlike the native inputs around it.
   *
   * A native field survives a rejected submit by re-reading its `defaultValue`
   * attribute, because React resets the form and the browser restores it from
   * there. Base UI reads `defaultValue` only at mount and warns if it changes
   * afterwards - so the same trick produces a console warning and, worse, a
   * dropdown that silently keeps its old selection.
   *
   * Holding the value in React state sidesteps both: React state is not touched
   * by a form reset, so the choice simply persists across a failed submit. The
   * prop is then only ever a starting point.
   */
  const [value, setValue] = useState<string | null>(defaultValue || null);

  return (
    <Select.Root
      name={name}
      items={options}
      value={value}
      onValueChange={(next) => setValue((next as string | null) ?? null)}
    >
      <Select.Trigger
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-sm border border-border bg-background px-3.5 py-2.5 text-left text-[0.95rem] outline-none transition-[border-color,box-shadow] duration-(--dur-base) ease-out-quint",
          "hover:border-ink/40 data-[popup-open]:border-violet",
          "aria-[invalid=true]:border-destructive",
          className,
        )}
      >
        {/* Falls back to the placeholder until something is chosen. */}
        <Select.Value>
          {(value: string | null) => (
            <span className={cn(!value && "text-ink-faint/70")}>
              {options.find((option) => option.value === value)?.label ??
                placeholder}
            </span>
          )}
        </Select.Value>
        <Select.Icon className="shrink-0 text-ink-faint transition-[transform,rotate] duration-(--dur-base) ease-out-quint data-[popup-open]:rotate-180">
          <ChevronDown size={16} aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        {/* `alignItemWithTrigger={false}` drops the list below the field rather
            than overlaying the selected row on top of it - predictable, and it
            never covers the label. */}
        <Select.Positioner
          align="start"
          side="bottom"
          sideOffset={6}
          alignItemWithTrigger={false}
          className="z-50 w-[var(--anchor-width)]"
        >
          <Select.Popup
            className={cn(
              "max-h-72 overflow-y-auto rounded-sm border border-border bg-paper p-1 shadow-[0_18px_40px_-24px_rgb(22_19_29/0.45)]",
              "origin-[var(--transform-origin)] transition-[opacity,transform] duration-(--dur-base) ease-out-quint",
              "data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0",
            )}
          >
            <Select.List>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2 text-[0.9rem] outline-none transition-colors duration-(--dur-swift)",
                    "data-[highlighted]:bg-ink data-[highlighted]:text-paper",
                    "data-[selected]:font-medium",
                  )}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="shrink-0">
                    <Check size={14} aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
