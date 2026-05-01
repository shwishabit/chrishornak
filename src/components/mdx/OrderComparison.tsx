interface ComparisonStep {
  n: string
  label: string
  state?: 'skipped' | 'start' | 'after'
}

interface OrderComparisonProps {
  eyebrow: string
  leftLabel: string
  leftSteps: ComparisonStep[]
  leftCaption: string
  rightLabel: string
  rightSteps: ComparisonStep[]
  rightCaption: string
  footer: string
}

export function OrderComparison({
  eyebrow,
  leftLabel,
  leftSteps,
  leftCaption,
  rightLabel,
  rightSteps,
  rightCaption,
  footer,
}: OrderComparisonProps) {
  return (
    <div className="my-10 rounded-xl border border-border/20 bg-muted/10 p-6 md:p-8">
      <p className="font-heading text-[11px] font-bold uppercase tracking-widest text-primary/70">
        {eyebrow}
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            {leftLabel}
          </p>
          <div className="mt-3 space-y-2">
            {leftSteps.map((step) => {
              const isStart = step.state === 'start'
              const isSkipped = step.state === 'skipped'
              return (
                <div
                  key={step.n}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                    isStart
                      ? 'border-red-400/40 bg-red-400/10'
                      : isSkipped
                        ? 'border-dashed border-border/20 bg-background/20'
                        : 'border-border/15 bg-background/40'
                  }`}
                >
                  <span
                    className={`font-mono text-base font-bold ${
                      isStart
                        ? 'text-red-400'
                        : isSkipped
                          ? 'text-muted-foreground/30'
                          : 'text-muted-foreground/60'
                    }`}
                  >
                    {step.n}
                  </span>
                  <span
                    className={`flex-1 text-sm font-medium ${
                      isSkipped
                        ? 'text-muted-foreground/40 line-through'
                        : isStart
                          ? 'font-semibold text-foreground'
                          : 'text-foreground/80'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isStart && (
                    <span className="rounded-full bg-red-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                      Start
                    </span>
                  )}
                  {isSkipped && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">
                      Skipped
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80">{leftCaption}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            {rightLabel}
          </p>
          <div className="mt-3 space-y-2">
            {rightSteps.map((step) => {
              const isStart = step.state === 'start'
              return (
                <div
                  key={step.n}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                    isStart ? 'border-primary/50 bg-primary/10' : 'border-border/20 bg-background/40'
                  }`}
                >
                  <span
                    className={`font-mono text-base font-bold ${
                      isStart ? 'text-primary' : 'text-primary/60'
                    }`}
                  >
                    {step.n}
                  </span>
                  <span className="flex-1 text-sm font-medium text-foreground/85">{step.label}</span>
                  {isStart && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Start
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80">{rightCaption}</p>
        </div>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{footer}</p>
    </div>
  )
}
