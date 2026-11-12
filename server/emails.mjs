// Kairos Life account emails: verification code and welcome. Table-based HTML with
// inline styles so they render the same in Gmail, Outlook and Apple Mail, plus a
// plain-text part. Images load from the site's own /brand folder.
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const INK = "#120c18", VIOLET = "#6b3fa0", GOLD = "#f2c84b", CREAM = "#faf5e9";
const FONT = "'Trebuchet MS', 'Segoe UI', Helvetica, Arial, sans-serif";

function frame({ origin, preheader, title, body }) {
  const logo = `${origin}/brand/kairos-life-wordmark-game.png`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#2b1d3a;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:#2b1d3a;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#2b1d3a;background-image:linear-gradient(160deg,#3a2a52 0%,#2b1d3a 45%,#1b1226 100%);">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
    <tr><td align="center" style="padding:0 0 18px;"><img src="${logo}" width="300" alt="Kairos Life" style="display:block;width:300px;max-width:80%;height:auto;border:0;"></td></tr>
    <tr><td style="background:${CREAM};border:4px solid ${INK};box-shadow:8px 8px 0 ${INK};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="height:10px;background:${VIOLET};background-image:linear-gradient(90deg,${VIOLET} 0 60%,#8a5bd6 60% 80%,${GOLD} 80% 100%);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:30px 32px 10px;font-family:${FONT};color:${INK};">${body}</td></tr>
        <tr><td style="padding:0 32px 28px;font-family:${FONT};color:#5a4d68;font-size:13px;line-height:1.5;">
          <p style="margin:18px 0 0;border-top:2px dashed #d8cbe6;padding-top:16px;">“The LORD bless thee, and keep thee: the LORD make his face shine upon thee, and be gracious unto thee.” <b style="color:${VIOLET};">Numbers 6:24–25</b></p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:22px 10px 0;font-family:${FONT};color:#c9bcd9;font-size:12px;line-height:1.6;">
      Kairos Life · Kairos World · A little play. A bigger story.<br>
      You're receiving this because this email was used to create a Kairos account.<br>
      <a href="${origin}" style="color:${GOLD};text-decoration:underline;">Open Kairos</a>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const button = (href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 6px;"><tr><td style="background:${GOLD};border:3px solid ${INK};box-shadow:4px 4px 0 ${INK};"><a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:16px;font-weight:800;color:${INK};text-decoration:none;">${label}</a></td></tr></table>`;

/** The 6-digit verification email. */
export function verificationEmail({ name, code, origin, email }) {
  const link = `${origin}/#family/verify?email=${encodeURIComponent(email)}&code=${code}`;
  const digits = String(code).split("").map((d) => `<td style="width:46px;height:58px;background:#fff;border:3px solid ${INK};box-shadow:3px 3px 0 ${INK};font-family:'Courier New',monospace;font-size:30px;font-weight:900;color:${VIOLET};text-align:center;">${d}</td><td style="width:8px;"></td>`).join("");
  const body = `
    <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:3px;color:${VIOLET};">VERIFY YOUR EMAIL</p>
    <h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;color:${INK};">One step to go, ${esc(name)}.</h1>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Welcome to Kairos Life! Enter this code to confirm it's really you and unlock your account.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;"><tr>${digits}</tr></table>
    <p style="margin:10px 0 0;font-size:13px;color:#5a4d68;">The code works for 15 minutes.</p>
    ${button(link, "Verify my email")}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#5a4d68;">Didn't sign up? You can safely ignore this email; no account is opened without this code.</p>`;
  return {
    subject: `${code} is your Kairos Life code`,
    html: frame({ origin, preheader: `Your Kairos Life verification code is ${code}.`, title: "Verify your email", body }),
    text: `One step to go, ${name}.\n\nYour Kairos Life verification code is: ${code}\nIt works for 15 minutes.\n\nOr open: ${link}\n\nDidn't sign up? Ignore this email.\n\n"The LORD bless thee, and keep thee" (Numbers 6:24)`,
  };
}

/** The welcome email after verification. */
export function welcomeEmail({ name, origin }) {
  const tile = (title, text, colour) => `<td valign="top" style="width:33%;padding:6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#fff;border:3px solid ${INK};border-top:8px solid ${colour};padding:12px;font-family:${FONT};"><b style="display:block;font-size:14px;color:${INK};margin-bottom:4px;">${title}</b><span style="font-size:12px;line-height:1.5;color:#5a4d68;">${text}</span></td></tr></table></td>`;
  const body = `
    <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:3px;color:${VIOLET};">WELCOME TO THE FAMILY</p>
    <h1 style="margin:0 0 14px;font-size:28px;line-height:1.25;color:${INK};">You're in, ${esc(name)}. Be blessed!</h1>
    <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">We're so glad you're here. Kairos Life is a place to play, grow and walk out your faith, one choice at a time. As you explore, may God bless you, keep you and fill every step with His grace.</p>
    <p style="margin:0 0 6px;font-size:16px;line-height:1.6;">Here's where to start:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px -6px 4px;"><tr>
      ${tile("Kairos World", "Walk London, ride to every Kharis branch and meet people along the way.", VIOLET)}
      ${tile("LTBS World", "Step inside Bible stories and play Scripture games.", GOLD)}
      ${tile("Your church", "Pick your Kharis branch and serve in your department.", "#3d8a5b")}
    </tr></table>
    ${button(`${origin}/#world`, "Enter Kairos World")}
    <p style="margin:18px 0 0;font-size:15px;line-height:1.6;">Grace and peace,<br><b>The Kairos team</b></p>`;
  return {
    subject: `Welcome to Kairos Life, ${name}. Be blessed!`,
    html: frame({ origin, preheader: "Your account is ready. Step into Kairos World.", title: "Welcome to Kairos Life", body }),
    text: `You're in, ${name}. Be blessed!\n\nWe're so glad you're here. Kairos Life is a place to play, grow and walk out your faith, one choice at a time. May God bless you, keep you and fill every step with His grace.\n\nStart here: ${origin}/#world\n- Kairos World: walk London and visit every Kharis branch.\n- LTBS World: step inside Bible stories.\n- Your church: pick your branch and serve in your department.\n\nGrace and peace,\nThe Kairos team`,
  };
}

/** Sends through Resend (https://resend.com). Returns undefined when no key is set. */
export function createResendMailer(apiKey, from, fetcher = fetch) {
  if (!apiKey || !from) return undefined;
  return {
    async send({ to, subject, html, text }) {
      const r = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, html, text }),
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) throw Object.assign(Error("Email provider refused the message."), { status: 502 });
    },
  };
}
