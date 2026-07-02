import { LockKeyhole } from "lucide-react";
import { PILOT_DISCLAIMER } from "@/lib/pilotFeatures";

interface PrototypeFeatureNoticeProps {
  feature: string;
  dark?: boolean;
}

export function PrototypeFeatureNotice({ feature, dark = false }: PrototypeFeatureNoticeProps) {
  return (
    <section
      data-testid="prototype-feature-notice"
      className={dark
        ? "rounded-2xl border border-amber-700/40 bg-amber-950/20 p-6 text-amber-100"
        : "rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900"}
    >
      <div className="flex items-center gap-2 font-semibold">
        <LockKeyhole className="h-4 w-4" />
        Prototype feature — not connected to this live client
      </div>
      <p className="mt-2 text-sm opacity-80">
        {feature} is disabled in the Supabase pilot. No live identity or client data is sent to the local prototype store.
      </p>
      <p className="mt-3 text-xs font-medium opacity-80">{PILOT_DISCLAIMER}</p>
    </section>
  );
}
