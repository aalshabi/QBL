import { CheckCircle2, Circle } from "lucide-react";
import type { TimelineEvent } from "@/lib/domain";

export function StatusTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.status} className="grid grid-cols-[24px_1fr] gap-3">
          {event.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}
          <div>
            <p className="text-sm font-semibold">{event.label}</p>
            <p className="text-xs text-muted-foreground ltr text-right">
              {event.at ? new Intl.DateTimeFormat("ar-SA", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(new Date(event.at)) : "بانتظار التحديث"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
