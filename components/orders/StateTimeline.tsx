import { getStateTone } from "@/lib/orders/orderUtils";
import type { StateTransition } from "@/lib/types/order";
import { formatDate } from "@/lib/utils/formatters";

interface StateTimelineProps {
  transitions: StateTransition[];
}

export function StateTimeline({ transitions }: StateTimelineProps) {
  const ordered = [...transitions].sort(
    (left, right) =>
      new Date(left.transitionedAt).getTime() -
      new Date(right.transitionedAt).getTime(),
  );

  if (!ordered.length) {
    return <p className="text-sm text-muted-foreground">No state transitions recorded.</p>;
  }

  return (
    <ol className="relative ml-2 border-l border-border">
      {ordered.map((transition, index) => {
        const tone = getStateTone(transition.toState);
        const isCurrent = index === ordered.length - 1;

        return (
          <li
            key={`${transition.toState}-${transition.transitionedAt}`}
            data-current={isCurrent || undefined}
            data-tone={tone}
            className="relative ml-5 pb-6 last:pb-0"
          >
            <span
              aria-hidden="true"
              className="absolute top-1 -left-[1.6rem] size-3 rounded-full border-2 border-background bg-muted-foreground data-[current=true]:bg-foreground"
              data-current={isCurrent}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span
                className={
                  tone === "danger"
                    ? "font-medium text-destructive"
                    : isCurrent
                      ? "font-medium text-foreground"
                      : "font-medium text-muted-foreground"
                }
              >
                {transition.toState}
              </span>
              <time className="text-xs text-muted-foreground">
                {formatDate(transition.transitionedAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
