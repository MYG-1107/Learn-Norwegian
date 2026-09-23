# Learn Norwegian — refined static-site package

This package is designed to be copied into the existing `MYG-1107/Learn-Norwegian` repository.

## Keep from the current repository
- `logo.svg`
- `Yaswanth.jpg`
- `Sukumar_Singarapu_Software_Engineer_Student_of_Vaagdevi_College_of_Engineering.jpeg`
- The current developer biography content, if you want to retain it on `contact-developers.html`

## Replace/add
- Replace `index.html`
- Replace or consolidate shared styles into `styles.css`
- Add `app.js`
- Add `privacy.html`
- Add `accessibility.html`
- Add `404.html`
- Refresh `about.html`
- Replace `robots.txt`
- Replace `sitemap.xml`

## Remove from the current version
`header.html` and `footer.html` are no longer needed. Static pages contain their own semantic header/footer so search engines and no-JavaScript users do not depend on a client-side partial loader.

## Important production note
The current prototype translation call uses a public Google Translate endpoint pattern in the browser. For a production service, move translation behind a backend and use an official translation API with controlled quotas and credentials.

The live weather section uses Open-Meteo and refreshes every 10 minutes. Open-Meteo's public free API is intended for non-commercial use and requires attribution under CC BY 4.0.
