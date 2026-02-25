---
description: Standard Operating Procedure for Adding New Tools
---

# Adding a New Tool to DGToolbox

Follow this strict protocol whenever a new tool is created to ensure full system integration.

1.  **Core Files Creation**
    *   Create `[tool-name].html` with SEO Meta Tags, Schema, and 'Helpful Content' section.
    *   Create `[tool-name].js` with the logic.

2.  **System Registration (app.js)**
    *   Open `app.js`.
    *   Add the tool object to the `TOOLS_LIST` array.
    *   Ensure keywords, icon, and description are accurate.

3.  **Service Worker Cache (sw.js)**
    *   Open `sw.js`.
    *   Increment the `CACHE_NAME` version (e.g., v22 -> v23).
    *   Add the new `.html` and `.js` files to the `ASSETS` array.

4.  **System Archives (about.html)**
    *   Open `about.html`.
    *   **Tool Guide:** Add a new card in the "The Armory" section describing the tool.
    *   **Changelog:** Add a new entry under the current version logging the addition.

5.  **Search Index (sitemap.xml)**
    *   Open `sitemap.xml`.
    *   Add the `<url>` entry for the new tool with appropriate priority (usually 0.8).

6.  **Validation**
    *   Verify the tool appears on the Dashboard (`index.html`).
    *   Verify the tool is searchable via the Command Palette.
    *   Verify the 'About' page reflects the new tool.
