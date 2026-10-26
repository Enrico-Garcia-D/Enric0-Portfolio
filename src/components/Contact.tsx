import { useState, type FormEvent } from 'react'
import { CONTACT_EMAIL, FORM_ENDPOINT, SOCIALS } from '../data'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const LABELS: Record<Status, string> = {
  idle: 'Send Message',
  sending: 'Sending...',
  sent: 'Message Sent',
  error: 'Error. Try again.',
}

export default function Contact() {
  const [status, setStatus] = useState<Status>('idle')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setStatus('sending')

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(String(res.status))
      form.reset()
      setStatus('sent')
      window.setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <footer id="contact" className="section fade-in">
      <h2 className="section-title">Get in Touch</h2>
      <div className="contact-layout">
        <div className="contact-info">
          <p className="contact-lead">
            Have a project in mind? Let&apos;s build something great together.
            {CONTACT_EMAIL && (
              <>
                {' '}
                Or email me at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </>
            )}
          </p>

          <ul className="social-links">
            {SOCIALS.map((s, i) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  <span className="social-idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="social-name">{s.label}</span>
                  <span className="social-arrow" aria-hidden="true">&#8599;</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form className="contact-form panel" onSubmit={onSubmit}>
          <div className="panel-head">
            <span>Send a message</span>
            <span className={`contact-led ${status}`} aria-hidden="true" />
          </div>
          <div className="contact-fields">
            {/* Honeypot: hidden from people, filled by bots; Formspree discards submissions that set it. */}
            <input type="text" name="_gotcha" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <label className="field-row">
              <span>Name</span>
              <input type="text" name="name" placeholder="Your name" required />
            </label>
            <label className="field-row">
              <span>Email</span>
              <input type="email" name="email" placeholder="you@example.com" required />
            </label>
            <label className="field-row">
              <span>Message</span>
              <textarea name="message" placeholder="Tell me about your project" rows={5} required />
            </label>
            <button type="submit" className="btn btn-solid" disabled={status === 'sending'}>
              {LABELS[status]}
            </button>
          </div>
        </form>
      </div>
    </footer>
  )
}
