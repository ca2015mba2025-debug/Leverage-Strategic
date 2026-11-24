// Vercel serverless function: stores anonymous site events in Supabase (table ls_events).
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANALYTICS_SALT (any long random string)
const crypto = require('crypto');
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|monitor/i;
const ALLOWED = new Set(['pageview','click','download','scroll','engaged','email_click','phone_click','booking_click','outbound_click','lead','form_start','mouse','rage_click','section','need_select','model_select','faq_open']);
const s = (v, n) => (typeof v === 'string' ? v.slice(0, n) : null);
function device(ua) { return /mobile|iphone|android/i.test(ua) ? 'mobile' : /ipad|tablet/i.test(ua) ? 'tablet' : 'desktop'; }
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  try {
    let b = req.body; if (typeof b === 'string') b = JSON.parse(b);
    const ua = req.headers['user-agent'] || '';
    if (!b || !ALLOWED.has(b.event) || BOT.test(ua)) { res.statusCode = 204; return res.end(); }
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const day = new Date().toISOString().slice(0, 10);
    const ip_hash = crypto.createHash('sha256').update(ip + ua + day + (process.env.ANALYTICS_SALT || '')).digest('hex').slice(0, 24);
    const u = b.utm || {};
    const row = { site: 'leverage-strategic', event: b.event, visitor_id: s(b.visitor_id, 40), session_id: s(b.session_id, 40), path: s(b.path, 200), title: s(b.title, 150),
      referrer: s(b.referrer, 300), utm_source: s(u.source, 80), utm_medium: s(u.medium, 80), utm_campaign: s(u.campaign, 120), utm_term: s(u.term, 120),
      props: b.props && typeof b.props === 'object' && JSON.stringify(b.props).length <= 2500 ? b.props : {}, country: s(req.headers['x-vercel-ip-country'], 4), region: s(req.headers['x-vercel-ip-country-region'], 20),
      city: s(decodeURIComponent(req.headers['x-vercel-ip-city'] || ''), 80), device: device(ua), ip_hash, viewport: Number.isFinite(b.vw) ? b.vw : null };
    const r = await fetch(process.env.SUPABASE_URL + '/rest/v1/ls_events', { method: 'POST',
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) });
    res.statusCode = r.ok ? 204 : 502; return res.end();
  } catch (e) { res.statusCode = 400; return res.end(); }
};
