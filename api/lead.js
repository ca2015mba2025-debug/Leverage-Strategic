// Vercel serverless function: saves a website request into Supabase (table site_leads) so Leverage OS can show it.
// Same env vars as track.js. The email to hello@leveragestrategic.com is sent separately by formsubmit.co.
const s = (v, n) => (typeof v === 'string' ? v.slice(0, n) : null);
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  try {
    let b = req.body; if (typeof b === 'string') b = JSON.parse(b);
    if (!b || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email || '')) { res.statusCode = 400; return res.end(); }
    const row = { site: 'leverage-strategic', name: s(b.name, 120), email: s(b.email, 200), company: s(b.company, 160), need: s(b.need, 80),
      timeline: s(b.timeline, 80), delivery: s(b.delivery, 120), message: s(b.message, 2000), path: s(b.path, 200), visitor_id: s(b.visitor_id, 40),
      referrer: s(b.referrer, 300), country: s(req.headers['x-vercel-ip-country'], 4), status: 'new' };
    const r = await fetch(process.env.SUPABASE_URL + '/rest/v1/site_leads', { method: 'POST',
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) });
    res.statusCode = r.ok ? 204 : 502; return res.end();
  } catch (e) { res.statusCode = 400; return res.end(); }
};
