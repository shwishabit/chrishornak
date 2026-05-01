interface Step {
  step: string
  title: string
  subtitle?: string
  body: string
}

export function OrderedSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="my-10 space-y-6">
      {steps.map((item) => (
        <div key={item.step} className="flex gap-5">
          <span className="font-heading text-2xl font-bold text-primary/30">{item.step}</span>
          <div>
            <p className="font-heading text-base font-bold text-foreground">{item.title}</p>
            {item.subtitle && <p className="text-xs text-primary/70">{item.subtitle}</p>}
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              {item.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
