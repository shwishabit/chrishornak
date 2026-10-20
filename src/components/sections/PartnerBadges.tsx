import Image from 'next/image'

/* Partner trust row under the hero buttons (homepage + /hire). White cards so the black
 * badges stay clear in dark mode. Shopify is text until the official badge from the
 * Partner Dashboard is in hand (Shopify's rules: the badge can't be altered or recreated). */
export function PartnerBadges({ className = '' }: { className?: string }) {
  return (
    <ul className={`m-0 flex list-none flex-wrap items-stretch gap-3 p-0 ${className}`} aria-label="Partner programs">
      <li className="flex items-center rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
        <Image
          src="/images/partners/squarespace-circle-gold-partner.png"
          alt="Squarespace Circle Gold Partner"
          width={1200}
          height={493}
          className="h-14 w-auto md:h-16"
        />
      </li>
      <li className="flex items-center rounded-xl bg-white px-5 py-3 shadow-sm ring-1 ring-black/5">
        <p className="m-0 font-heading leading-tight text-neutral-900">
          <span className="block text-2xl font-bold md:text-3xl">Shopify</span>
          <span className="block text-sm font-medium tracking-wide text-neutral-600 uppercase md:text-base">Partner</span>
        </p>
      </li>
    </ul>
  )
}
