'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface ContactFormState {
  success: boolean
  message: string
}

export async function submitContact(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Honeypot — bots fill hidden fields
  const honeypot = formData.get('company')
  if (honeypot) {
    // Fake success so bots think it worked
    return { success: true, message: "Thanks! I'll be in touch soon." }
  }

  // Timing check — reject submissions faster than 2 seconds
  const loadedAt = Number(formData.get('_t'))
  if (loadedAt && Date.now() - loadedAt < 2000) {
    return { success: true, message: "Thanks! I'll be in touch soon." }
  }

  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const message = (formData.get('message') as string)?.trim()

  if (!name || !email || !message) {
    return { success: false, message: 'Please fill out all required fields.' }
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Please enter a valid email address.' }
  }

  if (message.length < 10) {
    return { success: false, message: 'Please tell me a bit more about what you need.' }
  }

  try {
    await resend.emails.send({
      from: 'Chris Hornak <chris@chrishornak.com>',
      to: process.env.CONTACT_EMAIL!,
      replyTo: email,
      subject: `New message from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : null,
        '',
        message,
      ]
        .filter(Boolean)
        .join('\n'),
    })

    return { success: true, message: "Thanks! I'll be in touch soon." }
  } catch {
    return {
      success: false,
      message: 'Something went wrong. Try scheduling a call instead.',
    }
  }
}
