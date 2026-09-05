import { useState } from "react";
import { BadgeDollarSign, CheckCircle2, Clock3, CreditCard, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

const SAMPLE_PAYMENTS = [
  { id: "MST-1042", guest: "Sample guest", amount: "NLe 1,600", status: "Awaiting payment" },
  { id: "MST-1041", guest: "Sample guest", amount: "NLe 700", status: "Paid" },
  { id: "MST-1040", guest: "Sample guest", amount: "NLe 800", status: "Cancelled" },
] as const;

export function PaymentPreview() {
  const [testMode, setTestMode] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="mt-6 rounded-xl border border-gold/30 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gold" />
            <h2 className="font-display text-xl font-semibold">Payment workflow preview</h2>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
            Preview only. No payment provider is connected and these actions never charge a guest.
            Keep this area ready for the future payment integration.
          </p>
        </div>
        <span className="rounded-full bg-gold/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-gold">
          Not connected
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <PreviewMetric icon={Clock3} label="Awaiting payment" value="1" />
        <PreviewMetric icon={CheckCircle2} label="Paid (sample)" value="1" />
        <PreviewMetric icon={BadgeDollarSign} label="Test total" value="NLe 2,300" />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary px-3 py-3">
        <div>
          <p className="text-sm font-medium">Test mode</p>
          <p className="text-xs text-muted-foreground">
            Use sample status changes while payments are offline.
          </p>
        </div>
        <Button
          size="sm"
          variant={testMode ? "default" : "outline"}
          onClick={() => setTestMode((value) => !value)}
        >
          {testMode ? "Enabled" : "Disabled"}
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {SAMPLE_PAYMENTS.map((payment) => (
          <div
            key={payment.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-3 text-sm"
          >
            <div>
              <p className="font-medium">
                {payment.id} · {payment.guest}
              </p>
              <p className="text-xs text-muted-foreground">
                {payment.amount} · {payment.status}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!testMode}
              onClick={() => setSelected(payment.id)}
            >
              Simulate status
            </Button>
          </div>
        ))}
      </div>

      {selected && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <XCircle className="h-4 w-4 text-gold" /> Preview action recorded for {selected}; no real
          payment was processed.
        </p>
      )}
    </section>
  );
}

function PreviewMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <Icon className="h-4 w-4 text-gold" />
      <p className="mt-2 text-lg font-semibold">{value}</p>
      <p className="text-[0.7rem] text-muted-foreground">{label}</p>
    </div>
  );
}
