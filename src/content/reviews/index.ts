import type { ReviewContent } from './types'
import { vidarich } from './vidarich'
import { vidarichFollowup } from './vidarich-followup'
import { vidarichRound2 } from './vidarich-round2'

/** Every review's content, by slug. A review row's slug must match a key here. */
export const REVIEW_CONTENT: Record<string, ReviewContent> = {
  vidarich,
  'vidarich-followup': vidarichFollowup,
  'vidarich-round2': vidarichRound2,
}
