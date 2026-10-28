/* Content shape for one client review (/review/<token>). Each option has one or
 * more pages (home, order…); each page is a set of labeled sections. Section HTML
 * uses the .rvx classes in src/styles/review.css, and the option's theme class
 * sets its colors and fonts. */

export interface ReviewSection {
  /** Comment key and on-screen label, e.g. "A2". Matches /^[A-Za-z0-9_-]{1,40}$/. */
  key: string
  /** Short name the client sees next to the key, e.g. "Why these ingredients". */
  label: string
  html: string
}

export interface ReviewPage {
  /** "home", "order"… unique within the option. */
  key: string
  /** Shown on the page switch, e.g. "Home page". */
  label: string
  sections: ReviewSection[]
}

/** "Why this design" notes shown under the option's story: the main choices and the reason for each. */
export interface ReviewNotes {
  feel: string
  type: { display: string; body: string; sample: { family: string; weight: number; vs?: string }; why: string }
  colors: { hex: string; name: string }[]
  colorWhy: string
  audience: string
  /** The home page in AIDA order (Attention, Interest, Desire, Action), with the section keys for each step. */
  flow: { step: string; keys: string; text: string }[]
}

export interface ReviewOption {
  /** Letter shown to the client: "A", "B", "C". */
  key: string
  name: string
  /** One or two sentences on the angle this option takes. The first sentence shows on its tab. */
  story: string
  /** Theme class from review.css: "t-green", "t-gold", "t-stone". */
  theme: string
  /** Color chips shown in the option header. */
  palette: string[]
  notes?: ReviewNotes
  pages: ReviewPage[]
}

/** One thing we took from the client's notes. The client marks it right (reaction "like")
 * or not quite (reaction "change") and can add a note. */
export interface ReviewTakeaway {
  key: string
  title: string
  /** What we heard, in the client's terms. */
  heard: string
  /** What we will build because of it. */
  plan: string
}

/** One open question. The answer is the note; `choices` are one-tap answers that fill it. */
export interface ReviewQuestion {
  key: string
  q: string
  /** Why we ask, one line. */
  why?: string
  choices?: string[]
}

/** A follow-up page after a design review: takeaways to confirm, the client's own
 * questions answered, then our questions. Uses no options. */
export interface ReviewFollowup {
  takeaways: ReviewTakeaway[]
  answers?: { q: string; a: string }[]
  groups: { title: string; intro?: string; questions: ReviewQuestion[] }[]
}

export interface ReviewContent {
  slug: string
  title: string
  client: string
  /** Shown at the top: what the client is reviewing and how. */
  intro: string
  /** Public folder for this review's images, with a trailing slash. */
  assets: string
  /** Design options. Empty for a follow-up page. */
  options: ReviewOption[]
  followup?: ReviewFollowup
  /** Small print under the options (photo credits, draft notes). */
  fineprint: string
}

export function allSections(o: ReviewOption): ReviewSection[] {
  return o.pages.flatMap((p) => p.sections)
}

export function followupKeys(f: ReviewFollowup | undefined): string[] {
  return f ? [...f.takeaways.map((t) => t.key), ...f.groups.flatMap((g) => g.questions.map((q) => q.key))] : []
}

/** Every key the client may comment on: each section, each option overall, each follow-up item, and "general". */
export function commentKeys(content: ReviewContent): string[] {
  return [...content.options.flatMap((o) => [`${o.key}0`, ...allSections(o).map((s) => s.key)]), ...followupKeys(content.followup), 'general']
}
