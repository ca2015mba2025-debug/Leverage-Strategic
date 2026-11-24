// Daily Vercel cron: copies Google Search Console data (real search queries, impressions, clicks, position) into Supabase.
// Env: GSC_SERVICE_ACCOUNT_JSON, GSC_SITE_URL (e.g. sc-domain:leveragestrategic.com), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET
const crypto = require('crypto');
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const claim = b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: head + '.' + claim + '.' + sig }) });
  const j = await r.json(); if (!j.access_token) throw new Error('token'); return j.access_token;
}
const day = (d) => d.toISOString().slice(0, 10);
module.exports = async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== 'Bearer ' + process.env.CRON_SECRET) { res.statusCode = 401; return res.end('unauthorized'); }
  try {
    const sa = JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON);
    const token = await accessToken(sa);
    const end = new Date(Date.now() - 3 * 864e5), start = new Date(end.getTime() - 6 * 864e5); // Search Console data lags ~2 days
    const r = await fetch('https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(process.env.GSC_SITE_URL) + '/searchAnalytics/query', { method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: day(start), endDate: day(end), dimensions: ['date', 'query', 'page', 'country', 'device'], rowLimit: 25000 }) });
    const j = await r.json(); const rows = (j.rows || []).map((x) => ({ site: 'leverage-strategic', date: x.keys[0], query: x.keys[1], page: x.keys[2], country: x.keys[3], device: x.keys[4], clicks: x.clicks, impressions: x.impressions, ctr: x.ctr, position: x.position }));
    for (let i = 0; i < rows.length; i += 500) {
      const u = await fetch(process.env.SUPABASE_URL + '/rest/v1/site_search_console?on_conflict=site,date,query,page,country,device', { method: 'POST',
        headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows.slice(i, i + 500)) });
      if (!u.ok) throw new Error('db');
    }
    res.statusCode = 200; return res.end(JSON.stringify({ rows: rows.length }));
  } catch (e) { res.statusCode = 500; return res.end('error'); }
};
