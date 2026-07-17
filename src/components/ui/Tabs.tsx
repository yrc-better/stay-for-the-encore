import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode
} from "react";
import { classNames } from "./classNames";

export interface TabItem {
  id: string;
  label: ReactNode;
  content?: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  ariaLabel: string;
  className?: string;
  panelClassName?: string;
}

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  ariaLabel,
  className,
  panelClassName
}: TabsProps) {
  const generatedId = useId();
  const firstEnabledId = items.find((item) => !item.disabled)?.id ?? "";
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? firstEnabledId
  );
  const selectedValue = value ?? internalValue;
  const selectedItem =
    items.find((item) => item.id === selectedValue && !item.disabled) ??
    items.find((item) => !item.disabled);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const enabledIndexes = useMemo(
    () =>
      items
        .map((item, index) => (item.disabled ? -1 : index))
        .filter((index) => index >= 0),
    [items]
  );

  function selectTab(id: string) {
    if (value === undefined) {
      setInternalValue(id);
    }
    onValueChange?.(id);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    const enabledPosition = enabledIndexes.indexOf(currentIndex);
    let nextIndex = currentIndex;

    if (event.key === "Home") {
      nextIndex = enabledIndexes[0] ?? currentIndex;
    } else if (event.key === "End") {
      nextIndex = enabledIndexes[enabledIndexes.length - 1] ?? currentIndex;
    } else if (event.key === "ArrowRight") {
      const nextPosition = (enabledPosition + 1) % enabledIndexes.length;
      nextIndex = enabledIndexes[nextPosition] ?? currentIndex;
    } else {
      const previousPosition =
        (enabledPosition - 1 + enabledIndexes.length) % enabledIndexes.length;
      nextIndex = enabledIndexes[previousPosition] ?? currentIndex;
    }

    const nextItem = items[nextIndex];
    if (nextItem) {
      selectTab(nextItem.id);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <div className={classNames("bb-tabs", className)}>
      <div className="bb-tabs__list" role="tablist" aria-label={ariaLabel}>
        {items.map((item, index) => {
          const isSelected = item.id === selectedItem?.id;
          const tabId = `${generatedId}-tab-${item.id}`;
          const panelId = `${generatedId}-panel-${item.id}`;

          return (
            <button
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              className="bb-tabs__tab"
              type="button"
              role="tab"
              id={tabId}
              aria-controls={item.content !== undefined ? panelId : undefined}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => selectTab(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              key={item.id}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="bb-tabs__badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </div>
      {selectedItem?.content !== undefined && (
        <div
          className={classNames("bb-tabs__panel", panelClassName)}
          role="tabpanel"
          id={`${generatedId}-panel-${selectedItem.id}`}
          aria-labelledby={`${generatedId}-tab-${selectedItem.id}`}
          tabIndex={0}
        >
          {selectedItem.content}
        </div>
      )}
    </div>
  );
}
