import type { ReviewContent } from './types'
import { vidarich } from './vidarich'

/** Every review's content, by slug. A review row's slug must match a key here. */
export const REVIEW_CONTENT: Record<string, ReviewContent> = {
  vidarich,
}
