import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../server/supabaseAdmin.js';
import { sendEmail, renderContactEmail } from '../../server/services/email.js';

export async function handleContact(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, subject, message, status = 'unread' } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'name, email, and message are required' });
    }

    const { data: inserted, error: dbError } = await supabaseAdmin
      .from('contact_messages')
      .insert([{ name, email, phone, subject, message, status }])
      .select()
      .single();
    if (dbError) {
      return res.status(500).json({ success: false, error: 'Failed to save message' });
    }

    try {
      const to = process.env.CONTACT_RECIPIENT || process.env.EMAIL_TO || process.env.SMTP_USER;
      if (to) {
        await sendEmail({
          to,
          subject: subject ? `Contact: ${subject}` : 'New Contact Message',
          html: renderContactEmail({ name, email, phone, subject, message }),
          text: `New contact message from ${name} <${email}>\nPhone: ${phone || '-'}\nSubject: ${subject || '-'}\n\n${message}`,
        });
      }
    } catch {
      // ignore email failure
    }

    return res.json({ success: true, data: inserted });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to create contact message' });
  }
}

export async function handleContactSend(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  try {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'name, email, and message are required' });
    }
    const to = process.env.CONTACT_RECIPIENT || process.env.EMAIL_TO || process.env.SMTP_USER;
    if (!to) {
      return res.status(500).json({ success: false, error: 'Recipient email not configured' });
    }
    await sendEmail({
      to,
      subject: subject ? `Contact: ${subject}` : 'New Contact Message',
      html: renderContactEmail({ name, email, phone, subject, message }),
      text: `New contact message from ${name} <${email}>\nPhone: ${phone || '-'}\nSubject: ${subject || '-'}\n\n${message}`,
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Failed to send contact email' });
  }
}

