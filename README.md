# Leverage Strategic website: deploy, analytics and SEO

Static site (19 pages) plus two small server functions. Open `index.html` locally to preview.

## 1. Deploy (Vercel)
Upload this folder as a Vercel project (framework: Other, no build command). `api/track.js` and `api/gsc-sync.js` become server functions automatically.

## 2. Contact form and report requests
Messages and report requests go through formsubmit.co to hello@leveragestrategic.com.
One-time step: after the first test submission on the live site, formsubmit emails hello@leveragestrategic.com an activation link. Click it once.

## 3. Analytics (starts only after a visitor clicks Accept on the notice)
`assets/track.js` records anonymous events: page views, clicks (with page position), rage clicks, downloads, scroll depth, time in each section, sampled cursor movement, time on page, form starts, leads, source/UTM, country and device. Events go to `/api/track` and are stored in Supabase.
1. Run `supabase/site_analytics.sql` in the Supabase SQL editor (the Leverage OS project).
2. In Vercel, add environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANALYTICS_SALT` (any long random string). Enter them in Vercel only.
3. Leverage OS reads these ready-made views: `v_site_daily`, `v_site_top_pages`, `v_site_sources`, `v_site_landing`, `v_site_exit_pages`, `v_site_journeys`, `v_site_funnel`, `v_site_sections`, `v_site_click_heat`, `v_site_cursor_heat`, `v_site_rage_clicks`, `v_site_downloads`, `v_site_leads`, `v_site_clicks`, `v_site_organic`.

## 4. Google organic search (SEO)
Already in the site: unique titles and descriptions, canonical URLs, structured data, sitemap.xml, robots.txt, Open Graph tags.
Steps after launch:
1. Add leveragestrategic.com to Google Search Console (domain property, DNS verification) and submit `sitemap.xml`.
2. Real search queries come only from Search Console. `api/gsc-sync.js` copies them daily into Supabase (views `v_site_search_queries` and `v_site_search_pages`). Setup: create a Google Cloud service account, enable the Search Console API, add the service account email as a user on the Search Console property, then set Vercel variables `GSC_SERVICE_ACCOUNT_JSON`, `GSC_SITE_URL` (for example `sc-domain:leveragestrategic.com`) and `CRON_SECRET`.
3. Organic traffic grows with useful content over months. It does not arrive automatically from the site alone.

## 5. Privacy
`privacy.html` and the consent notice are included as drafts. Have a lawyer review the privacy text before launch.

## Report PDFs
`work/downloads/` holds the PDFs. Keep this folder in the deployed site.
