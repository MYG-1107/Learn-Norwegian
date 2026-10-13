# QA and SEO report — Learn Norwegian

**Scope:** source-level audit and upgrade package for the GitHub Pages project `MYG-1107/Learn-Norwegian`.

## Summary

The original repository is a small static site. It has useful basics—HTML metadata, a sitemap, `robots.txt`, a skip link, responsive CSS and local practice history—but the learning experience and search coverage were limited. A single homepage targeting a broad phrase such as “Learn Norwegian” is unlikely to cover the many distinct things beginners search for.

This upgrade adds meaningful learning pages, internal navigation, unique titles/descriptions/canonical URLs, structured data where appropriate, a refreshed sitemap, and a local flashcard/quiz experience. It aims to make the site easier to crawl and more useful. It does **not** guarantee first place or any particular position in search results.

## Source-level checks performed on this package

- [x] Core HTML pages have a language declaration, viewport metadata, unique page title, description, and canonical URL.
- [x] Main learning content is present in the HTML, not rendered only after JavaScript starts.
- [x] New pages are linked from the homepage, navigation, or related learning pages.
- [x] Sitemap contains the intended indexable pages with absolute URLs and a recent `lastmod` date.
- [x] `robots.txt` allows crawling and points to the sitemap.
- [x] 404 page is marked `noindex` and is not included in the sitemap.
- [x] Forms and key actions use labels or descriptive text; keyboard focus is visible and reduced-motion preferences are respected.
- [x] Vocabulary and quiz data are local, and generated user-facing text is inserted with `textContent` rather than unsafe HTML insertion.
- [x] Service-worker scope and precache URLs are relative to the GitHub Pages project path rather than the whole domain root.
- [ ] Live microphone permissions, supported browsers, speech voices, translation endpoint and weather API must be tested in real browsers after deployment.
- [ ] Search Console indexing, canonical selection and Core Web Vitals must be verified in the owner's Google Search Console / PageSpeed Insights; these results cannot be read without live browser testing and property access.

## User-facing features added

1. **Vocabulary flashcards:** 32 beginner words and expressions across greetings, polite phrases, food/drink, travel, time, work/study, places, people and verbs.
2. **Self-marked recall:** learners can mark a word as known or needing review. This list is deliberately simple and is not presented as an advanced spaced-repetition algorithm.
3. **Five-question quiz:** unique prompts, multiple-choice distractors, immediate feedback, retry, attempts and best score.
4. **Daily word and streak:** selected by local date; progress stored in local storage. It is private to that browser/device and has no account sync.
5. **Offline reading:** a service worker tries to cache core pages and static files. First visit needs a network connection; translation and weather still need the internet.
6. **SEO content coverage:** standalone guides for Norwegian beginners, everyday phrases and pronunciation; cross-links between learning pages.

## SEO implementation

- Main page: targets a clear intent around learning Norwegian online and Bokmål speaking practice.
- Learning Centre: targets Norwegian vocabulary flashcards and quizzes.
- Beginner guide: targets Norwegian for beginners, basic Bokmål grammar and first-week learning.
- Phrasebook: targets everyday Norwegian phrases with English meanings.
- Pronunciation page: targets æ, ø, å and Norwegian pronunciation for beginners.
- One canonical URL per indexable HTML page; no unnecessary `meta keywords` tag, because it is not a useful modern Google ranking lever.
- Structured data describes the web application or relevant page. Structured data can help search engines interpret a page but does not guarantee a rich result.
- Site-wide internal links and sitemap make more of the useful material discoverable to crawlers.
- Static text content is readable without running the interactive quiz code.

## Manual release checklist

### Functional QA

- [ ] On the homepage, type “Good morning” and translate in English → Norwegian Bokmål mode.
- [ ] Swap direction and translate a short Norwegian sentence into English.
- [ ] Test the microphone with permission granted, denied, and unsupported-browser behaviour; typing must remain available in every case.
- [ ] Test pronunciation, copy-to-clipboard, clear history, and the eight-entry history cap.
- [ ] On Learning Centre, change categories, reveal answers, mark words known/review, shuffle, and use previous/next.
- [ ] Take a quiz, answer correctly and incorrectly, complete all five questions, retry, and check best score persistence after refresh.
- [ ] Verify daily word changes by date; verify streak remains the same within one day and updates after a new day of practice.
- [ ] Refresh each page, test mobile menu, keyboard navigation, focus visibility and 320–390 px viewport widths.
- [ ] Disable the network after the first online visit and verify cached learning pages still open. Confirm translation/weather show a non-fatal unavailable state.
- [ ] Verify the weather section labels the data source and does not block the learning tools if the request fails.

### SEO and crawl checks after publishing

1. Add/verify the property `https://myg-1107.github.io/Learn-Norwegian/` in Google Search Console. Use the verification method offered by Search Console.
2. Submit `https://myg-1107.github.io/Learn-Norwegian/sitemap.xml` under **Sitemaps** and check for processing errors.
3. Use **URL Inspection** on the homepage and each new learning page. Confirm “Crawl allowed?”, successful page fetch, “Indexing allowed?”, the expected canonical URL, and the rendered text.
4. After confirming the deployed versions are correct, request indexing for the most important updated pages. A request is not a guarantee of indexing or ranking.
5. Check the live URLs in PageSpeed Insights and run Lighthouse on mobile. Fix real issues in Core Web Vitals, image transfer size, console errors and accessibility; do not optimise for a score alone.
6. Monitor Search Console queries, impressions, clicks, index coverage and page experience for several weeks. Use data to improve content instead of repeating keywords unnaturally.
7. Consider adding a custom domain if this will become a long-term learning brand. Keep redirects and canonical URLs consistent if you migrate later.
8. Earn legitimate mentions/links from relevant learning communities and share genuinely useful resources. Do not buy spam links or create thin pages solely for keywords.

## Ranking expectations

Nobody can honestly guarantee that a new or small site will rank first for “Learn Norwegian”. That query is broad and competitive. The more realistic strategy is to build trustworthy, useful content that can satisfy specific learner intent (beginner guide, phrasebook, pronunciation and vocabulary practice), then measure which queries begin to bring impressions. Search engines control crawling frequency, indexing and ranking; a sitemap and indexing request help discovery but do not force placement.

## Known limitations / follow-up

- This source package could not be exercised against the live deployed site in a full browser from the available environment. After upload, run the manual test list.
- Translation uses a public Google Translate endpoint pattern, not an official contracted API. For a public production service, replace it with a supported API through a backend with rate limiting, privacy controls and monitoring.
- Browser speech support varies; feature detection and a text-entry fallback are provided, but a browser/device matrix still needs a real-user test pass.
- A custom domain, Search Console property, Search performance data, backlinks and an editorial maintenance plan are outside source code and require owner action.

## Automated checks run for the generated package

- [x] `node --check` passed for `app.js`, `learning.js`, `pwa.js` and `sw.js`.
- [x] Static link/metadata/ID checks ran across all 10 HTML files: zero errors. The repository-retained assets listed in the README were treated as expected dependencies.
- [x] Sitemap syntax/targets and the web manifest JSON were checked; nine sitemap URLs map to included indexable pages.
- [x] Mock-DOM interaction smoke test passed for the homepage app's direction switching, translation result display, history rendering and weather rendering with test responses.
- [x] Mock-DOM interaction smoke test passed for the Learning Centre's answer reveal, marking a known word, category filter, quiz option generation, quiz completion, score display and local-storage persistence.
- [ ] A real browser could not load the local test server in the provided QA environment. Therefore microphone permission prompts, real external API behaviour, service-worker install/offline navigation, responsive rendering and live-site HTTP responses remain deployment-time manual checks, not certified pass results.
