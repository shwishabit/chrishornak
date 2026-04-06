'use client'

import { useRef, useState, useEffect, useActionState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Send, Loader2 } from 'lucide-react'
import { connectContent } from '@/lib/data'
import { fadeUp, stagger, ease } from '@/lib/animations'
import { submitContact, type ContactFormState } from '@/app/actions'

const steps = [
  { num: '1', title: 'Conversation', detail: 'We talk about your business, your goals, and what\'s not working.' },
  { num: '2', title: 'Diagnosis', detail: 'I dig into the data, your market, and your competition.' },
  { num: '3', title: 'Strategy', detail: 'A clear plan — what to do, why, and in what order.' },
  { num: '4', title: 'Execution', detail: 'Hands-on or with a team. I stay involved until it\'s working.' },
]

const initialState: ContactFormState = { success: false, message: '' }

export function Connect() {
  const [state, formAction, isPending] = useActionState(submitContact, initialState)
  const [loadedAt] = useState(() => Date.now())
  const [phone, setPhone] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  // Reset form on success
  useEffect(() => {
    if (state.success) { formRef.current?.reset(); setPhone('') }
  }, [state])

  // Re-trigger Cal.com's element detection after React mounts
  useEffect(() => {
    const Cal = (window as any).Cal
    if (Cal?.ns?.['30min']) {
      Cal.ns['30min']('on', { action: '*', callback: () => {} })
    }
  }, [])

  return (
    <section id="connect" className="px-6 py-24 md:px-12 md:py-32 lg:px-24">
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={stagger}
        className="mx-auto max-w-5xl"
      >
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease }}
          className="text-sm font-medium uppercase tracking-widest text-primary"
        >
          Connect
        </motion.p>
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6, ease }}
          className="mt-2 h-px w-12 bg-primary/40"
        />

        <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
          {/* Left — copy + Calendly CTA + checkmarks */}
          <motion.div variants={fadeUp} transition={{ duration: 0.7, ease }}>
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-5xl">
              {connectContent.headline}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {connectContent.body}
            </p>
            {/* Process steps */}
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4">
              {steps.map((step) => (
                <div key={step.title} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {step.num}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              type="button"
              data-cal-link="chris-hornak/30min"
              data-cal-namespace="30min"
              data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"dark"}'
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
            >
              {connectContent.ctaText} <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>

          {/* Right — contact form */}
          <motion.div variants={fadeUp} transition={{ duration: 0.7, ease }}>
            <form
              ref={formRef}
              action={formAction}
              className="glass-card flex flex-col gap-5 p-8"
            >
              <p className="text-sm font-medium text-muted-foreground">Or drop me a message</p>

              {/* Honeypot — hidden from real users */}
              <input
                type="text"
                name="company"
                autoComplete="off"
                tabIndex={-1}
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              {/* Timing field */}
              <input type="hidden" name="_t" value={loadedAt} />

              <div>
                <label htmlFor="contact-name" className="sr-only">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  placeholder="Name"
                  required
                  autoComplete="name"
                  className="w-full rounded-lg border border-border/50 bg-muted/50 px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="sr-only">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-border/50 bg-muted/50 px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="sr-only">Phone (optional)</label>
                <input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  placeholder="Phone (optional)"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className="w-full rounded-lg border border-border/50 bg-muted/50 px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="sr-only">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  placeholder="What are you working on?"
                  rows={4}
                  required
                  minLength={10}
                  className="w-full resize-none rounded-lg border border-border/50 bg-muted/50 px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/20 disabled:opacity-50"
              >
                {isPending ? (
                  <>Sending<Loader2 className="h-3.5 w-3.5 animate-spin" /></>
                ) : (
                  <>Send message <Send className="h-3.5 w-3.5" /></>
                )}
              </button>

              {/* Status message */}
              {state.message && (
                <p
                  className={`text-sm ${
                    state.success ? 'text-primary' : 'text-red-400'
                  }`}
                >
                  {state.message}
                </p>
              )}
            </form>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
