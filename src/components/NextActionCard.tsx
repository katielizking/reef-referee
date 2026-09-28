import { AlertTriangle, ArrowRight, ClipboardCheck, Info } from "lucide-react";
import type { NextAction } from "@/lib/next-action";
import type { SectionId } from "@/components/TankSetupPanel";

const TONE: Record<NextAction["tone"], { accent: string; Icon: typeof Info; label: string }> = {
  critical: { accent: "var(--verdict-critical)", Icon: AlertTriangle, label: "Fix this first" },
  high: { accent: "var(--verdict-caution)", Icon: AlertTriangle, label: "Fix this first" },
  medium: { accent: "var(--verdict-caution)", Icon: Info, label: "Next step" },
  confirm: { accent: "var(--warn)", Icon: ClipboardCheck, label: "Before you trust the results" },
};

export function NextActionCard({
  action,
  onOpenSection,
}: {
  action: NextAction;
  onOpenSection?: (section: SectionId) => void;
}) {
  const { accent, Icon, label } = TONE[action.tone];
  return (
    <section
      aria-label={label}
      className="fishtankr-panel border-l-4 p-5"
      style={{ borderLeftColor: accent }}
    >
      <p className="science-label text-muted-foreground">{label}</p>
      <p className="mt-3 flex items-start gap-2 font-display text-lg font-semibold text-foreground">
        <Icon className="mt-1 h-4 w-4 shrink-0" style={{ color: accent }} aria-hidden />
        {action.title}
      </p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{action.action}</p>
      {action.section && onOpenSection && (
        <button
          type="button"
          onClick={() => onOpenSection(action.section!)}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Check them now <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      )}
    </section>
  );
}
