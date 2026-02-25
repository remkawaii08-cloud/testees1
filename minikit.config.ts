const ROOT_URL = "https://testees1.vercel.app";

export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjIzODAxMjYsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhiRTU0NWRkNGEyZkU1QzJGQ0RFNmM1MmEyMjFiNjIyNUZiNjRGN2MzIn0",
    payload: "eyJkb21haW4iOiJ0ZXN0ZWVzMS52ZXJjZWwuYXBwIn0",
    signature: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEFxSJGyzB2tPI_7ABqF8NUKwV7wpZFJvphZyXHMkbGm8lSHwbiKlZnJQSuxnkeF74aQ57prZCb-jg972Gf84Q9oGwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  },
  miniapp: {
    version: "1",
    name: "teesteesst1",
    subtitle: "A Base Mini-App",
    description: "Built with Base Builder",
    screenshotUrls: ["https://testees1.vercel.app/image.png"],
    iconUrl: "https://testees1.vercel.app/image.png",
    splashImageUrl: "https://testees1.vercel.app/image.png",
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: "https://testees1.vercel.app/api/webhook",
    primaryCategory: "social",
    tags: ["base", "miniapp"],
    heroImageUrl: "https://testees1.vercel.app/image.png",
    tagline: "play game",
    ogTitle: "teesteesst1",
    ogDescription: "Built with Base Builder",
    ogImageUrl: "https://testees1.vercel.app/image.png",
    "noindex": true

  },
} as const;
