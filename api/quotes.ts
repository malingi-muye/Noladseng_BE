import { VercelRequest, VercelResponse } from '@vercel/node';
import { sendEmail, renderQuoteEmail } from '../server/services/email.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const data = req.body || {};
    if (!data?.email && !data?.name && !data?.project_name && !data?.description) {
      return res.status(400).json({ success: false, error: 'Missing quote fields' });
    }

    const to = process.env.QUOTES_RECIPIENT || process.env.EMAIL_TO || process.env.SMTP_USER;
    if (!to) {
      return res.status(500).json({ success: false, error: 'Recipient email not configured' });
    }

    await sendEmail({
      to,
      subject: `New Quote Request: ${data.project_name || data.name || 'Untitled'}`,
      html: renderQuoteEmail(data),
      text: `New quote request\nProject: ${data.project_name || '-'}\nName: ${data.name || '-'}\nEmail: ${data.email || '-'}\nPhone: ${data.phone || '-'}\nBudget: ${data.budget_range || '-'}\nTimeline: ${data.timeline || '-'}\n\nDescription:\n${data.description || '-'}\n\nRequirements:\n${data.requirements || '-'}`,
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Quote handler error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to send quote email' });
  }
}
