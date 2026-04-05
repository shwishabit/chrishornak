import type { Metadata } from 'next'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { JsonLd } from '@/components/ui/JsonLd'
import { siteConfig } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  alternates: {
    canonical: '/privacy',
  },
  description: 'Privacy policy for chrishornak.com — how your information is collected, used, and protected.',
}

export default function PrivacyPage() {
  return (
    <main id="main-content" className="relative min-h-screen">
      <BackgroundMesh />
      <Navigation />
      <div className="px-6 pt-32 pb-24 md:px-12 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated: April 5, 2026
          </p>

          <div className="mt-12 space-y-10 text-sm leading-relaxed text-muted-foreground [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-3 [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
            <section>
              <h2>Information I Collect</h2>
              <p>
                When you use the contact form on this site, I collect the information you
                provide: your name, email address, phone number (if provided), and message.
                This information is used solely to respond to your inquiry.
              </p>
              <p>
                If you schedule a call through Cal.com, your information is collected and
                processed by Cal.com according to their own privacy policy. I receive your
                name, email, and any details you provide when booking.
              </p>
              <p>
                If you use the Findability Check tool, the URL you enter is sent to a
                server I operate to fetch and analyze that website&apos;s public HTML. Your
                IP address is temporarily logged for rate limiting (kept for 60 seconds,
                then discarded). No account or personal information is required to use
                the tool, and no data about the URLs you check is stored after the
                analysis is returned to your browser.
              </p>
            </section>

            <section>
              <h2>How I Use Your Information</h2>
              <p>Information collected through this site is used to:</p>
              <ul>
                <li>Respond to your inquiries and messages</li>
                <li>Schedule and conduct consultations</li>
                <li>Follow up on business discussions you initiate</li>
              </ul>
              <p>
                I do not sell, rent, or share your personal information with third parties
                for marketing purposes.
              </p>
            </section>

            <section>
              <h2>Cookies and Tracking</h2>
              <p>
                This site uses Google Analytics (GA4) to understand how visitors interact
                with the site — including pages visited, time on site, and general
                geographic region. This data is aggregated and anonymous. Google Analytics
                may set cookies on your browser. You can opt out using the{' '}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>
                .
              </p>
              <p>
                No advertising or third-party tracking cookies are used beyond what is
                described above.
              </p>
            </section>

            <section>
              <h2>Third-Party Services</h2>
              <p>This site uses the following third-party services:</p>
              <ul>
                <li>
                  <strong className="text-foreground">Google Analytics (GA4)</strong> — for
                  site usage analytics. Subject to{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google&apos;s Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong className="text-foreground">Cal.com</strong> — for scheduling
                  calls. Subject to{' '}
                  <a
                    href="https://cal.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Cal.com&apos;s Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong className="text-foreground">Resend</strong> — for
                  delivering contact form emails. Subject to{' '}
                  <a
                    href="https://resend.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Resend&apos;s Privacy Policy
                  </a>
                  .
                </li>
              </ul>
            </section>

            <section>
              <h2>Data Retention</h2>
              <p>
                Contact form submissions are retained only as long as needed to respond to
                your inquiry and any resulting business relationship. You may request
                deletion of your information at any time.
              </p>
            </section>

            <section>
              <h2>Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Request access to personal information I hold about you</li>
                <li>Request correction or deletion of your information</li>
                <li>Withdraw consent for future communications</li>
              </ul>
            </section>

            <section>
              <h2>Children&apos;s Privacy</h2>
              <p>
                This site is not directed at children under the age of 13. I do not
                knowingly collect personal information from children. If you believe a
                child has submitted information through this site, please contact me and I
                will delete it promptly.
              </p>
            </section>

            <section>
              <h2>Server Logs</h2>
              <p>
                The hosting provider for this site may automatically collect technical
                information such as your IP address, browser type, and pages visited. This
                data is used for security and performance purposes and is not combined with
                other personal information.
              </p>
            </section>

            <section>
              <h2>Changes to This Policy</h2>
              <p>
                This policy may be updated from time to time. Changes will be reflected on
                this page with an updated date at the top. Continued use of the site after
                changes constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                If you have questions about this privacy policy or how your data is
                handled, please use my{' '}
                <a
                  href="/#connect"
                  className="text-primary hover:underline"
                >
                  contact form
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
            { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: `${siteConfig.domain}/privacy` },
          ],
        }}
      />
    </main>
  )
}
