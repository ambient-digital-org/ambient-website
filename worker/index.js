export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders(env, request) });
    }

    try {
      const data = await request.json();
      const { name, email, subject, message } = data;

      if (!name || !email || !message) {
        return Response.json(
          { error: 'Name, email, and message are required.' },
          { status: 400, headers: corsHeaders(env, request) }
        );
      }

      const emailSubject = subject
        ? `${subject} — from ${name}`
        : `New message from ${name}`;

      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
          <div style="border-bottom: 2px solid #0b1d35; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 18px; color: #0b1d35;">New Contact Form Submission</h2>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 13px; width: 80px; vertical-align: top;">Name</td>
              <td style="padding: 10px 0; font-size: 15px;">${esc(name)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 13px; vertical-align: top;">Email</td>
              <td style="padding: 10px 0; font-size: 15px;"><a href="mailto:${esc(email)}" style="color: #5a7db5;">${esc(email)}</a></td>
            </tr>
            ${subject ? `<tr>
              <td style="padding: 10px 0; color: #888; font-size: 13px; vertical-align: top;">Subject</td>
              <td style="padding: 10px 0; font-size: 15px;">${esc(subject)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 13px; vertical-align: top;">Message</td>
              <td style="padding: 10px 0; font-size: 15px; line-height: 1.6;">${esc(message).replace(/\n/g, '<br>')}</td>
            </tr>
          </table>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #aaa;">
            Sent from the contact form on ambient-digital.com
          </div>
        </div>
      `;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Ambient Digital <${env.FROM_EMAIL}>`,
          to: [env.TO_EMAIL],
          reply_to: email,
          subject: emailSubject,
          html: htmlBody,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Resend error:', err);
        return Response.json(
          { error: 'Failed to send message. Please try again.' },
          { status: 500, headers: corsHeaders(env, request) }
        );
      }

      return Response.json(
        { success: true, message: 'Message sent successfully.' },
        { status: 200, headers: corsHeaders(env, request) }
      );

    } catch (err) {
      console.error('Worker error:', err);
      return Response.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500, headers: corsHeaders(env, request) }
      );
    }
  }
};

function corsHeaders(env, request) {
  const origin = request?.headers?.get('Origin') || '';
  const allowed = [env.ALLOWED_ORIGIN, 'http://localhost:8080'];
  const match = allowed.includes(origin) ? origin : env.ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': match,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
