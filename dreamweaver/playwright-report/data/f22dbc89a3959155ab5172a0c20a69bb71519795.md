# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.ts >> homepage has title
- Location: tests/e2e/example.spec.ts:3:5

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /DreamWeaver/
Received string:  "Create Next App"
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    8 × unexpected value "Create Next App"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - img "Next.js logo" [ref=e4]
    - generic [ref=e5]:
      - heading "To get started, edit the page.tsx file." [level=1] [ref=e6]
      - paragraph [ref=e7]:
        - text: Looking for a starting point or more instructions? Head over to
        - link "Templates" [ref=e8] [cursor=pointer]:
          - /url: https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app
        - text: or the
        - link "Learning" [ref=e9] [cursor=pointer]:
          - /url: https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app
        - text: center.
    - generic [ref=e10]:
      - link "Vercel logomark Deploy Now" [ref=e11] [cursor=pointer]:
        - /url: https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app
        - img "Vercel logomark" [ref=e12]
        - text: Deploy Now
      - link "Documentation" [ref=e13] [cursor=pointer]:
        - /url: https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app
  - button "Open Next.js Dev Tools" [ref=e19] [cursor=pointer]:
    - img [ref=e20]
  - alert [ref=e23]
```

# Test source

```ts
  1 | import { test, expect } from '@playwright/test';
  2 | 
  3 | test('homepage has title', async ({ page }) => {
  4 |   await page.goto('/');
> 5 |   await expect(page).toHaveTitle(/DreamWeaver/);
    |                      ^ Error: expect(page).toHaveTitle(expected) failed
  6 | });
  7 | 
```