/**
 * iOS-style settings row with colored square icon.
 * @module features/settings/components
 */

import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

export type IconTone =
  | "blue"
  | "indigo"
  | "red"
  | "emerald"
  | "orange"
  | "violet"
  | "gold"
  | "gray"
  | "destructive";

const TONE_BG: Record<IconTone, string> = {
  blue: "bg-gradient-to-b from-sky-400 to-sky-600",
  indigo: "bg-gradient-to-b from-indigo-400 to-indigo-600",
  red: "bg-gradient-to-b from-rose-500 to-rose-600",
  emerald: "bg-gradient-to-b from-emerald-500 to-emerald-600",
  orange: "bg-gradient-to-b from-orange-400 to-orange-500",
  violet: "bg-gradient-to-b from-violet-500 to-violet-600",
  gold: "bg-gradient-to-b from-amber-400 to-amber-500",
  gray: "bg-gradient-to-b from-zinc-500 to-zinc-600",
  destructive: "bg-gradient-to-b from-rose-500 to-rose-700",
};

interface Props {
  icon: LucideIcon;
  tone?: IconTone;
  label: string;
  description?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  noChevron?: boolean;
}

export function SettingsRow({
  icon: Icon,
  tone = "emerald",
  label,
  description,
  onClick,
  rightElement,
  destructive = false,
  noChevron = false,
}: Props) {
  const haptics = useHapticFeedback();
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={() => {
        if (!onClick) return;
        haptics.impactLight();
        onClick();
      }}
      className={`w-full flex items-center gap-3 py-2.5 px-1 min-h-[52px] transition-transform ${
        onClick ? "cursor-pointer active:scale-[0.985]" : ""
      }`}
    >
      <div
        className={`w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0 shadow-sm ${
          destructive ? TONE_BG.destructive : TONE_BG[tone]
        }`}
      >
        <Icon className="w-[15px] h-[15px] text-white" strokeWidth={2.2} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p
          className={`text-[15px] font-medium leading-tight truncate ${
            destructive ? "text-destructive" : "text-foreground"
          }`}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
        )}
      </div>
      {rightElement ?? (onClick && !noChevron && (
        <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
      ))}
    </Wrapper>
  );
}

export default SettingsRow;
