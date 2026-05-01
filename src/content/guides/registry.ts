import type { ComponentType } from 'react'
import type { Guide } from '@/lib/guides'

import StrategyFirstMdx, { frontmatter as strategyFirstFrontmatter } from './strategy-first.mdx'

interface MdxGuide {
  Component: ComponentType
  frontmatter: Guide
}

export const mdxGuides: Record<string, MdxGuide> = {
  'strategy-first': {
    Component: StrategyFirstMdx,
    frontmatter: strategyFirstFrontmatter as unknown as Guide,
  },
}

export function getMdxGuide(slug: string): MdxGuide | undefined {
  return mdxGuides[slug]
}
