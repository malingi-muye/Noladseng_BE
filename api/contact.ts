import { VercelRequest, VercelResponse } from '@vercel/node';
import { sendEmail, renderContactEmail } from '../server/services/email.js';
import { supabaseAdmin } from '../server/supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('[contact:create] body:', req.body);
    const { name, email, phone, subject, message, status = 'unread' } = req.body || {};
    
    if (!name || !email || !message) {
      console.warn('[contact:create] validation failed');
      return res.status(400).json({ 
        success: false, 
        error: 'name, email, and message are required' 
      });
    }

    // Insert into DB with service role to bypass RLS
    const { data: inserted, error: dbError } = await supabaseAdmin
      .from('contact_messages')
      .insert([{ name, email, phone, subject, message, status }])
      .select()
      .single();
      
    if (dbError) {
      console.error('DB insert failed:', dbError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save message' 
      });
    }

    // Send notification email (best-effort)
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
    } catch (emailError) {
      console.warn('Email send failed (continuing):', emailError);
    }

    return res.json({ success: true, data: inserted });
  } catch (error: any) {
    console.error('Contact handler error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error?.message || 'Failed to create contact message' 
    });
  }
}
