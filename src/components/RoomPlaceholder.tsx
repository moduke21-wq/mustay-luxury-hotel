import { BedDouble } from "lucide-react";

export function RoomPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-navy ${className}`}
      role="img"
      aria-label={`${label} photography coming soon`}
    >
      <div className="absolute inset-0 opacity-70 [background:radial-gradient(120%_90%_at_20%_0%,rgba(217,119,6,0.35),transparent_60%)]" />
      <div className="absolute inset-3 rounded-sm border border-gold/30" />
      <div className="relative flex flex-col items-center gap-2 px-6 text-center">
        <BedDouble className="h-7 w-7 text-gold" strokeWidth={1.25} />
        <span className="font-display text-lg text-background">{label}</span>
        <span className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">Mustay Luxury</span>
      </div>
    </div>
  );
}
