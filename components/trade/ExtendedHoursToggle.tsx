interface ExtendedHoursToggleProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly showOvernightWarning?: boolean;
}

export function ExtendedHoursToggle({ checked, onChange, disabled, showOvernightWarning }: ExtendedHoursToggleProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        Extended hours
      </label>
      {showOvernightWarning && (
        <p className="text-xs text-yellow-600">This symbol may not support extended hours trading.</p>
      )}
    </div>
  );
}
