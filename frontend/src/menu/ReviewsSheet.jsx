import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import Sheet from '../components/Sheet'
import { api } from '../lib/api'

export default function ReviewsSheet({ open, onClose, slug, t, lang }) {
  const [reviews, setReviews] = useState(null)
  const [error, setError] = useState(null)
  const [writing, setWriting] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!open || reviews) return
    api(`/public/${slug}/comments/`, { auth: false })
      .then((page) => setReviews(page.results))
      .catch(setError)
  }, [open, slug, reviews])

  return (
    <Sheet open={open} onClose={onClose} title={t.reviewsTitle} closeLabel={t.close}>
      {sent ? (
        <p className="sheet__notice" role="status">{t.reviewSent}</p>
      ) : writing ? (
        <ReviewForm slug={slug} t={t} onSent={() => setSent(true)} />
      ) : (
        <button type="button" className="menu-button" onClick={() => setWriting(true)}>
          {t.writeReview}
        </button>
      )}

      {error && <p className="form-error" role="alert">{error.message}</p>}
      {reviews && reviews.length === 0 && <p className="sheet__text">{t.noReviews}</p>}
      {reviews && reviews.length > 0 && (
        <ul className="reviews">
          {reviews.map((r) => (
            <li key={r.id} className="review">
              <div className="review__head">
                <strong>{r.author_name}</strong>
                <Stars value={r.rating} label={t.stars(r.rating)} />
              </div>
              <p>{r.text}</p>
              <time dateTime={r.created_at}>
                {new Date(r.created_at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', {
                  day: 'numeric',
                  month: 'long',
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  )
}

function Stars({ value, label }) {
  return (
    <span className="stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} aria-hidden="true" className={n <= value ? 'is-on' : ''} />
      ))}
    </span>
  )
}

function ReviewForm({ slug, t, onSent }) {
  const [rating, setRating] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    if (!rating) {
      setError(t.rating)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api(`/public/${slug}/comments/`, {
        method: 'POST',
        auth: false,
        body: { author_name: form.get('author_name'), text: form.get('text'), rating },
      })
      onSent()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <fieldset className="rating-input">
        <legend>{t.rating}</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= rating ? 'is-on' : ''}>
            <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} />
            <Star size={28} aria-hidden="true" />
            <span className="visually-hidden">{t.stars(n)}</span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span>{t.yourName}</span>
        <input name="author_name" maxLength={60} autoComplete="given-name" />
      </label>
      <label className="field">
        <span>{t.yourReview}</span>
        <textarea name="text" required minLength={3} maxLength={1000} rows={4} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="menu-button" disabled={busy}>
        {t.sendReview}
      </button>
    </form>
  )
}
