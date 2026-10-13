# Learn Norwegian — QA, SEO and Learning Upgrade

This is a static GitHub Pages site for practising Norwegian Bokmål. It includes sentence practice, optional browser speech features, useful phrases, a beginner guide, a pronunciation guide, a local vocabulary flashcard/quiz learning centre, and optional weather information.

## Deployment

1. Download and unzip this package.
2. Upload the included files to the root of `MYG-1107/Learn-Norwegian` on GitHub and choose to replace existing files with the same names.
3. **Keep the existing assets** `logo.svg`, `og-image.png`, `Yaswanth.jpg`, and `Sukumar_Singarapu_Software_Engineer_Student_of_Vaagdevi_College_of_Engineering.jpeg`. They are referenced by parts of the current repository or its social metadata and are intentionally not duplicated in this source package.
4. Commit to the `main` branch. GitHub Pages should then publish the updated site from the repository's configured publishing source. Wait for its Pages deployment workflow to finish before testing the live URL.
5. Open the deployed site in a private/incognito window and test the checklist in `QA-SEO-REPORT.md`.

If GitHub Pages uses a non-root publishing folder rather than the repository root, copy the site files to that configured folder instead.

## Added learner features

- Vocabulary flashcards grouped by topic, with answer reveal, previous/next navigation, shuffle, speech playback, and “known” / “review again” tracking.
- A five-question multiple-choice quiz with instant feedback, best-score tracking and a retry flow.
- A daily word prompt, study streak and progress counters stored in local browser storage.
- Beginner guide, everyday phrasebook, and pronunciation guide with useful standalone text content and internal links.
- Optional service-worker caching for key pages and scripts after the first successful online load. Static learning pages can be available offline; translation and live weather still require the internet.
- Updated titles, descriptions, canonical links, structured data, internal linking, sitemap and robots.txt.

## Important technical notes

- This is a front-end project. There is no user account, backend or cross-device progress sync.
- The translation call uses a public Google Translate endpoint pattern directly in the browser. It is a prototype integration and is not a supported production API contract; service behaviour can change or fail. Do not submit sensitive text.
- Voice input depends on the browser's Speech Recognition API, which is not available in every browser. Speech output depends on installed voices.
- Open-Meteo is used for optional weather data. Review the provider's current terms and attribution requirements before any commercial use.
- No ranking position or indexing outcome can be guaranteed. Follow the manual Search Console steps in the QA report after deployment.

## Local testing

The site is plain HTML/CSS/JavaScript and has no build step. Serve the directory from a local web server to test service workers; service workers generally require HTTPS or localhost. Check JavaScript syntax, XML validity, internal links and metadata before publishing.

When changing cached assets in future releases, increment `CACHE_NAME` in `sw.js` (for example, `learn-norwegian-static-v2`) so returning visitors receive the new files.
