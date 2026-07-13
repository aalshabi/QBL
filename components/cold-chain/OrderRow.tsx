import { cn } from "@/lib/utils";
import {
  formatTime,
  isWithinRange,
  type ColdChainOrder,
} from "@/data/coldChain";
import { RiskBadge, SlaBadge, StatusBadge, ZoneBadge } from "./Badges";

export default function OrderRow({ order }: { order: ColdChainOrder }) {
  const tempOk = order.currentTemperatureC == null
    ? null
    : isWithinRange(order.currentTemperatureC, order.temperatureRange);

  return (
    <tr className="border-t border-muted hover:bg-muted/30">
      <td className="px-3 py-3 text-sm">
        <div className="font-latin font-bold text-primary ltr">{order.reference}</div>
        <div className="mt-0.5 text-xs text-slatebrand">{order.clientName}</div>
      </td>
      <td className="px-3 py-3 text-sm">
        <div className="text-primary">{order.productType}</div>
        <div className="mt-1"><ZoneBadge zone={order.zone} /></div>
      </td>
      <td className="px-3 py-3 text-sm">
        <div className="text-slatebrand">{order.pickupLocation}</div>
        <div className="mt-1 text-xs text-slatebrand/80">→ {order.deliveryLocation}</div>
      </td>
      <td className="px-3 py-3 text-sm">
        <div className="font-latin text-primary ltr">
          {formatTime(order.deliveryWindow.start)} – {formatTime(order.deliveryWindow.end)}
        </div>
      </td>
      <td className="px-3 py-3 text-sm">
        {order.currentTemperatureC != null ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 font-latin text-xs font-bold ltr",
              tempOk
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700",
            )}
          >
            {order.currentTemperatureC.toFixed(1)}°C
          </span>
        ) : (
          <span className="text-xs text-slatebrand">—</span>
        )}
      </td>
      <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
      <td className="px-3 py-3"><SlaBadge priority={order.slaPriority} /></td>
      <td className="px-3 py-3"><RiskBadge level={order.riskLevel} /></td>
    </tr>
  );
}
