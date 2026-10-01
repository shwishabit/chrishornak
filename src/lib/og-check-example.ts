import type { OgCheckResult } from './og-check'

/* A real /api/og-check result for https://chrishornak.com/blog/og-image,
 * captured 2026-10-01T22:59:19.011Z (one page fetch + the image + the favicon). Shown as the
 * page's Example before a visitor checks their own link. The image and favicon are
 * drawn from the same files on this site (/images/blog/og-image-card.png, /icon.png),
 * so the snapshot carries no data: URIs. Re-capture if that post's tags change. */
export const OG_CHECK_EXAMPLE: OgCheckResult = {
  "url": "https://chrishornak.com/blog/og-image",
  "domain": "chrishornak.com",
  "checkedAt": "2026-10-01T22:59:19.011Z",
  "tags": {
    "title": "What to put in an OG image so the right people click",
    "description": "What to put in an OG image, its title and description so a shared link sets the right expectation, plus the check I run before any card goes live.",
    "type": "article",
    "url": "https://chrishornak.com/blog/og-image",
    "image": "https://chrishornak.com/images/blog/og-image-card.png",
    "imageAlt": "A chat message holding a link preview: a large teal image of a sun and hills, grey bars standing in for the title and description, and a mouse cursor resting on it before the click.",
    "imageWidth": "1200",
    "imageHeight": "630",
    "siteName": null
  },
  "htmlTitle": "What to put in an OG image so the right people click | Chris Hornak",
  "h1": "What to put in an OG image so the right people click",
  "image": {
    "url": "https://chrishornak.com/images/blog/og-image-card.png",
    "status": 200,
    "contentType": "image/png",
    "bytes": 64075,
    "width": 1200,
    "height": 630,
    "format": "PNG"
  },
  "checks": [
    {
      "id": "size",
      "label": "Size",
      "status": "pass",
      "value": "1200 × 630",
      "rule": "At least 1200 × 630 · LinkedIn allows 627",
      "sources": [
        {
          "label": "Meta",
          "href": "https://developers.facebook.com/docs/sharing/webmasters/images"
        },
        {
          "label": "LinkedIn",
          "href": "https://www.linkedin.com/help/linkedin/answer/a521928"
        }
      ]
    },
    {
      "id": "shape",
      "label": "Shape",
      "status": "pass",
      "value": "1.905 : 1",
      "rule": "Close to 1.91 : 1",
      "sources": [
        {
          "label": "Meta",
          "href": "https://developers.facebook.com/docs/sharing/webmasters/images"
        },
        {
          "label": "LinkedIn",
          "href": "https://www.linkedin.com/help/linkedin/answer/a521928"
        }
      ]
    },
    {
      "id": "width",
      "label": "Width",
      "status": "pass",
      "value": "1200 px",
      "rule": "At least 900 px wide",
      "sources": [
        {
          "label": "Apple TN3156",
          "href": "https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages"
        }
      ]
    },
    {
      "id": "filesize",
      "label": "File size",
      "status": "pass",
      "value": "63 KB",
      "rule": "Under 5 MB (LinkedIn) · under 8 MB (Meta)",
      "sources": [
        {
          "label": "LinkedIn",
          "href": "https://www.linkedin.com/help/linkedin/answer/a521928"
        },
        {
          "label": "Meta",
          "href": "https://developers.facebook.com/docs/sharing/webmasters/images"
        }
      ]
    },
    {
      "id": "loads",
      "label": "Image loads",
      "status": "pass",
      "value": "200 · PNG",
      "rule": "200, an image, no redirect · tested once, Oct 1, 2026",
      "sources": []
    },
    {
      "id": "tags",
      "label": "Required tags",
      "status": "pass",
      "value": "4 of 4",
      "rule": "og:title, og:type, og:image, og:url",
      "sources": [
        {
          "label": "ogp.me",
          "href": "https://ogp.me/"
        }
      ]
    },
    {
      "id": "alt",
      "label": "Image alt",
      "status": "pass",
      "value": "Present",
      "rule": "og:image:alt",
      "sources": [
        {
          "label": "ogp.me",
          "href": "https://ogp.me/"
        }
      ]
    },
    {
      "id": "sitename",
      "label": "No site name in title",
      "status": "pass",
      "value": "Clean",
      "rule": "Put the site name in og:site_name instead",
      "sources": [
        {
          "label": "Apple TN3156",
          "href": "https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages"
        }
      ]
    }
  ],
  "passed": 8,
  "google": {
    "title": "What to put in an OG image so the right people click | Chris Hornak",
    "titleSource": "title",
    "description": "What to put in an OG image, its title and description so a shared link sets the right expectation, plus the check I run before any card goes live.",
    "bodyText": "An OG image is the picture that shows up when someone shares your link. With the title and description beside it, it tells people what the page is before they click. So it decides who clicks, not only how many.",
    "noindex": false,
    "nosnippet": false,
    "siteName": "Chris Hornak",
    "siteNameSource": "schema",
    "isHome": false,
    "breadcrumb": [
      "Home",
      "Blog",
      "What to put in an OG image so the right people click"
    ],
    "datePublished": "2026-09-30",
    "faviconUrl": "https://chrishornak.com/icon.png?995b2b5e90297c1f",
    "favicon": {
      "url": "https://chrishornak.com/icon.png?995b2b5e90297c1f",
      "status": 200,
      "contentType": "image/png",
      "bytes": 3655,
      "width": 192,
      "height": 192,
      "format": "PNG"
    }
  }
}
