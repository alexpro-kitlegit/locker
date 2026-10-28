import clsx from "clsx";
import { Check } from "lucide-react";
import { formatDateTime, ORDER_STEPS } from "../lib/format";
import type { Order } from "../lib/types";

export function OrderTimeline({ order }: { order: Order }) {
  const reached = ORDER_STEPS.findIndex((s) => s.status === order.status);
  return (
    <ol className="space-y-0">
      {ORDER_STEPS.map((step, i) => {
        const event = order.events.find((e) => e.status === step.status);
        const done = i <= reached;
        return (
          <li key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={clsx(
                  "grid h-5 w-5 place-items-center rounded-full",
                  done ? "bg-accent text-on-accent" : "border-2 border-neutral-200 bg-white",
                )}
              >
                {done && <Check className="h-3 w-3" strokeWidth={3.5} />}
              </span>
              {i < ORDER_STEPS.length - 1 && <span className={clsx("w-0.5 flex-1", i < reached ? "bg-accent" : "bg-neutral-200")} />}
            </div>
            <div className="pb-4">
              <p className={clsx("text-sm font-semibold", !done && "text-neutral-400")}>{step.label}</p>
              {event && <p className="text-xs text-neutral-500">{formatDateTime(event.at)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
