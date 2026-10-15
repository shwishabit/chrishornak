'use server'

import { Resend } from 'resend'
import { ROLE_BUDGETS, ROLE_TIMELINES } from '@/lib/data'

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

/** /hire role form: same spam guards and Resend sender as submitContact. */
export async function submitRole(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const thanks = { success: true, message: "Thanks! I read every role and reply soon." }
  if (formData.get('company')) return thanks
  const loadedAt = Number(formData.get('_t'))
  if (loadedAt && Date.now() - loadedAt < 2000) return thanks

  const field = (k: string) => ((formData.get(k) as string | null) ?? '').trim()
  const name = field('name')
  const email = field('email')
  const role = field('role')
  const listing = field('listing')
  const timeline = field('timeline')
  const budget = field('budget')

  if (!name || !email || !role) {
    return { success: false, message: 'Please add your name, email and the role.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Please enter a valid email address.' }
  }
  if (role.length < 10) {
    return { success: false, message: 'Please tell me a bit more about the role.' }
  }
  if (listing && !/^https?:\/\/\S+$/i.test(listing)) {
    return { success: false, message: 'The listing link should start with http:// or https://.' }
  }
  const pick = (v: string, list: readonly string[]) => (list.includes(v) ? v : '')

  try {
    await resend.emails.send({
      from: 'Chris Hornak <chris@chrishornak.com>',
      to: process.env.CONTACT_EMAIL!,
      replyTo: email,
      subject: `Contract role from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Timeline: ${pick(timeline, ROLE_TIMELINES) || 'not given'}`,
        `Budget: ${pick(budget, ROLE_BUDGETS) || 'not given'}`,
        listing ? `Listing: ${listing}` : null,
        '',
        role,
        '',
        '(Sent from chrishornak.com/hire)',
      ]
        .filter((l) => l !== null)
        .join('\n'),
    })
    return thanks
  } catch {
    return { success: false, message: 'Something went wrong. Try booking a call instead.' }
  }
}
