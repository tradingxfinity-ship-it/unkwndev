/**
 * Subscriber confirmation email. Dark cyberpunk styling with neon green
 * accents. Inline styles only — email clients (especially Outlook + Gmail)
 * strip <style> blocks, classes, and most modern CSS.
 */

export function confirmationEmail({ email, siteName = 'UNKWN', siteUrl = '' }) {
  const safeEmail = String(email || '')
  const subject = `${siteName} // ACCESS GRANTED`
  const preheader = 'Transmission received. Stand by for the next signal.'

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#000;color:#b3ffb3;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;">
  <span style="display:none;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escape(preheader)}
  </span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:linear-gradient(180deg,#020503 0%,#000 100%);border:1px solid rgba(0,255,65,0.35);border-radius:6px;box-shadow:0 0 30px rgba(0,255,65,0.18);">
          <!-- top bar -->
          <tr>
            <td style="padding:14px 22px;border-bottom:1px solid rgba(0,255,65,0.18);font-size:10px;letter-spacing:0.3em;color:#7fff9a;text-transform:uppercase;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="font-size:10px;letter-spacing:0.3em;color:#7fff9a;">
                    ● ${escape(siteName)} // SECURE LINK
                  </td>
                  <td align="right" style="font-size:10px;letter-spacing:0.3em;color:#4cff7a;opacity:0.6;">
                    0x7F :: AES-256-GCM
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- headline -->
          <tr>
            <td align="center" style="padding:48px 24px 12px;">
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;letter-spacing:0.2em;font-size:34px;line-height:1.1;color:#d6ffd6;text-shadow:0 0 14px rgba(0,255,65,0.65);">
                ACCESS&nbsp;GRANTED
              </div>
              <div style="margin-top:10px;font-size:11px;letter-spacing:0.3em;color:#7fff9a;text-transform:uppercase;opacity:0.85;">
                ▸ transmission received
              </div>
            </td>
          </tr>

          <!-- divider -->
          <tr>
            <td align="center" style="padding:18px 24px 8px;">
              <table role="presentation" width="220" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td height="1" style="background:linear-gradient(90deg,transparent,#00ff41,transparent);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- body copy -->
          <tr>
            <td style="padding:18px 32px 8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:13px;line-height:1.7;color:#b3ffb3;">
              <p style="margin:0 0 14px;">welcome, operator.</p>
              <p style="margin:0 0 14px;">your node has been registered. the channel is live.</p>
              <p style="margin:0 0 14px;color:#7fff9a;">we will reach out the moment the gate opens.</p>
            </td>
          </tr>

          <!-- meta panel -->
          <tr>
            <td style="padding:14px 32px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid rgba(0,255,65,0.22);border-radius:4px;background:rgba(0,255,65,0.04);">
                <tr>
                  <td style="padding:12px 14px;font-size:11px;letter-spacing:0.18em;color:#7fff9a;text-transform:uppercase;">
                    <div style="opacity:0.7;">REGISTERED IDENTITY</div>
                    <div style="margin-top:4px;color:#d6ffd6;letter-spacing:0.08em;text-transform:none;font-size:13px;word-break:break-all;">
                      ${escape(safeEmail)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 14px 12px;font-size:10px;letter-spacing:0.3em;color:#4cff7a;opacity:0.55;text-transform:uppercase;">
                    SESSION 0x7F :: A2D9 &nbsp; · &nbsp; SIG VALID
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${siteUrl ? `<tr>
            <td align="center" style="padding:4px 32px 28px;">
              <a href="${escape(siteUrl)}" style="display:inline-block;border:1px solid rgba(0,255,65,0.45);background:rgba(0,255,65,0.08);color:#d6ffd6;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;letter-spacing:0.35em;font-size:11px;text-transform:uppercase;text-decoration:none;padding:12px 22px;border-radius:4px;">
                RETURN TO NODE
              </a>
            </td>
          </tr>` : ''}

          <!-- footer -->
          <tr>
            <td style="padding:14px 22px;border-top:1px solid rgba(0,255,65,0.18);font-size:10px;letter-spacing:0.3em;color:#4cff7a;opacity:0.55;text-transform:uppercase;">
              ⚠ do not share this link · zero-knowledge channel
            </td>
          </tr>
        </table>

        <div style="margin-top:18px;font-size:10px;letter-spacing:0.3em;color:#4cff7a;opacity:0.45;text-transform:uppercase;">
          ${escape(siteName)} // NODE-07 ONLINE
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text =
    `${siteName} // ACCESS GRANTED\n\n` +
    `Welcome, operator.\n` +
    `Your node has been registered. The channel is live.\n` +
    `We will reach out the moment the gate opens.\n\n` +
    `Registered identity: ${safeEmail}\n` +
    `Session 0x7F::A2D9 · SIG VALID\n\n` +
    (siteUrl ? `Return to node: ${siteUrl}\n` : '')

  return { subject, html, text }
}

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
