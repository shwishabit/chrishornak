export default function Loading() {
  // Deliberately NOT a <main>. Next streams this fallback into the served HTML
  // ahead of the real page, so using <main> here put two <main> landmarks in
  // the document. That is invalid HTML, it gives screen readers two "main"
  // regions, and anything that extracts <main> to read the page (crawlers,
  // answer engines, our own Blog Grader) got the spinner instead of the article.
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-screen items-center justify-center"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
