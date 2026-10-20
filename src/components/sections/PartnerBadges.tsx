import Image from 'next/image'

/* Quiet partner row in the footer, under the bio (Chris, 2026-10-19: the hero was too loud).
 * Monochrome, small. Shopify is text until the
 * official badge from the Partner Dashboard is in hand (Shopify's rules: no altered or recreated badge). */
export function PartnerBadges({ className = '' }: { className?: string }) {
  return (
    <ul className={`m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-3 p-0 opacity-75 ${className}`} aria-label="Partner programs">
      <li>
        <Image
          src="/images/partners/squarespace-circle-gold-partner.png"
          alt="Squarespace Circle Gold Partner"
          width={1200}
          height={493}
          className="h-9 w-auto invert light:invert-0"
        />
      </li>
      <li className="h-7 w-px bg-border" aria-hidden="true" />
      <li className="font-heading leading-none text-foreground">
        <span className="block text-base font-bold">Shopify</span>
        <span className="mt-1 block text-[10px] font-semibold tracking-[.14em] uppercase">Partner</span>
      </li>
    </ul>
  )
}
