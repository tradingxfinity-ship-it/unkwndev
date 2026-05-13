/**
 * Admin notification email — fired whenever a new subscriber signs up.
 * Shorter, more utilitarian than the user confirmation. Same dark theme so
 * it's easy to spot in a busy inbox.
 */

export function adminNotifyEmail({
  email,
  source = 'hero',
  userAgent = '',
  ip = '',
  siteName = 'UNKWN',
  createdAt = new Date().toISOString(),
}) {
  const subject = `${siteName} // new signal · ${email}`
  const safeEmail = String(email || '')
  const safeSource = String(source || '')
  const safeUA = String(userAgent || '').slice(0, 256)
  const safeIp = String(ip || '')

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#000;color:#b3ffb3;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#020503;border:1px solid rgba(0,255,65,0.30);border-radius:6px;">
          <tr>
            <td style="padding:14px 22px;border-bottom:1px solid rgba(0,255,65,0.18);font-size:10px;letter-spacing:0.3em;color:#7fff9a;text-transform:uppercase;">
              ▣ ${escape(siteName)} // ADMIN ALERT
            </td>
          </tr>
          <tr>
            <td style="padding:26px 28px 6px;">
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;letter-spacing:0.18em;font-size:22px;color:#d6ffd6;text-shadow:0 0 10px rgba(0,255,65,0.5);">
                NEW SIGNAL DETECTED
              </div>
              <div style="margin-top:6px;font-size:11px;letter-spacing:0.28em;color:#7fff9a;text-transform:uppercase;opacity:0.85;">
                ▸ subscriber registered
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid rgba(0,255,65,0.22);border-radius:4px;background:rgba(0,255,65,0.04);">
                ${row('email', safeEmail)}
                ${row('source', safeSource)}
                ${row('timestamp', createdAt)}
                ${safeIp ? row('ip', safeIp) : ''}
                ${safeUA ? row('user-agent', safeUA) : ''}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 22px 18px;border-top:1px solid rgba(0,255,65,0.18);font-size:10px;letter-spacing:0.3em;color:#4cff7a;opacity:0.55;text-transform:uppercase;">
              ◉ auto-generated · do not reply
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text =
    `${siteName} // NEW SIGNAL DETECTED\n\n` +
    `email:      ${safeEmail}\n` +
    `source:     ${safeSource}\n` +
    `timestamp:  ${createdAt}\n` +
    (safeIp ? `ip:         ${safeIp}\n` : '') +
    (safeUA ? `user-agent: ${safeUA}\n` : '')

  return { subject, html, text }
}

function row(label, value) {
  return `<tr>
    <td style="padding:10px 14px;border-bottom:1px dashed rgba(0,255,65,0.12);">
      <div style="font-size:10px;letter-spacing:0.28em;color:#7fff9a;text-transform:uppercase;opacity:0.7;">${escape(label)}</div>
      <div style="margin-top:3px;font-size:13px;color:#d6ffd6;word-break:break-all;">${escape(value)}</div>
    </td>
  </tr>`
}

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
