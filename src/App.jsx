import { useState, useEffect } from 'react'
import './index.css'

const CREATORS = [
  {
    name: 'Camille Laurent',
    handle: '@camille · 287k followers',
    cover: 'https://images.unsplash.com/photo-1543158181-e6f9f6712055?w=600&q=80',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&q=80',
    stays: ['Paris', 'Amalfi', 'Kyoto', '+9 more'],
    stats: [{ num: '12', label: 'Stays' }, { num: '€840', label: 'Avg/booking' }, { num: '94%', label: 'Match rate' }],
    modal: { name: 'Hôtel Richer', loc: 'Paris, France', price: '€420' },
  },
  {
    name: 'Marcos Silva',
    handle: '@marcos · 156k followers',
    cover: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&q=80',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    stays: ['Positano', 'Lisbon', 'Morocco'],
    stats: [{ num: '8', label: 'Stays' }, { num: '€1,200', label: 'Avg/booking' }, { num: '91%', label: 'Match rate' }],
    modal: { name: 'Villa Serafina', loc: 'Positano, Italy', price: '€680' },
  },
  {
    name: 'Yuna Inoue',
    handle: '@yuna · 421k followers',
    cover: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    stays: ['Kyoto', 'Seoul', 'Bali', '+6 more'],
    stats: [{ num: '21', label: 'Stays' }, { num: '¥92k', label: 'Avg/booking' }, { num: '97%', label: 'Match rate' }],
    modal: { name: 'Ryokan Tanuki', loc: 'Kyoto, Japan', price: '¥85,000' },
  },
]

function useFadeInObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Toast({ message, show }) {
  return <div className={`toast${show ? ' show' : ''}`}>{message}</div>
}

function Modal({ isOpen, onClose, stay, onConfirm }) {
  const [selectedNights, setSelectedNights] = useState('2 nights')
  const nights = ['2 nights', '3 nights', '5 nights', '1 week']

  if (!stay) return null

  return (
    <div
      className={`modal-overlay${isOpen ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-stayed">
          <div className="modal-stayed-av" style={{ backgroundImage: `url('${stay.avatar}')` }} />
          <span>Stayed here by <strong>{stay.creator}</strong></span>
        </div>
        <div className="modal-title">{stay.name}</div>
        <div className="modal-loc">{stay.loc}</div>
        <div className="modal-price-row">
          <div className="price">{stay.price}</div>
          <div className="price-per">/ night</div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label>Select nights</label>
          <div className="modal-nights">
            {nights.map(n => (
              <button
                key={n}
                className={`night-btn${selectedNights === n ? ' selected' : ''}`}
                onClick={() => setSelectedNights(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <button className="modal-book-btn" onClick={onConfirm}>Book this stay →</button>
        <div className="modal-note">
          10% commission shared with <span>{stay.creator}</span> · No hidden fees
        </div>
      </div>
    </div>
  )
}

function Nav() {
  return (
    <nav>
      <a href="#" className="logo">V<span>.</span>ia</a>
      <ul>
        <li><a href="#how" onClick={(e) => { e.preventDefault(); scrollTo('how') }}>How it works</a></li>
        <li><a href="#creators" onClick={(e) => { e.preventDefault(); scrollTo('creators') }}>Creators</a></li>
        <li><a href="#stays" onClick={(e) => { e.preventDefault(); scrollTo('stays') }}>Stays</a></li>
        <li>
          <a href="#waitlist" className="nav-cta" onClick={(e) => { e.preventDefault(); scrollTo('waitlist') }}>
            Request Access
          </a>
        </li>
      </ul>
    </nav>
  )
}

function Hero({ onOpenModal }) {
  return (
    <section className="hero">
      <div className="hero-left">
        <div className="hero-eyebrow">Creator-led travel marketplace</div>
        <h1 className="hero-headline">
          Travel <em>via</em> people<br />you already trust.
        </h1>
        <p className="hero-sub">
          Via connects travelers with the exact places their favorite creators have stayed —
          making inspiration instantly bookable.
        </p>
        <div className="hero-actions">
          <a href="#waitlist" className="btn-primary" onClick={(e) => { e.preventDefault(); scrollTo('waitlist') }}>
            Request early access
          </a>
          <a href="#how" className="btn-ghost" onClick={(e) => { e.preventDefault(); scrollTo('how') }}>
            See how it works
          </a>
        </div>
      </div>
      <div className="hero-right">
        <div className="hero-collage">
          <div className="collage-img">
            <div className="creator-badge">
              <div className="creator-avatar" />
              <div>
                <div className="creator-name">Camille Laurent</div>
                <div className="creator-stayed">stayed here · jan 2025</div>
              </div>
            </div>
          </div>
          <div className="collage-img">
            <div className="stayed-tag">Stayed here</div>
          </div>
          <div className="collage-img" />
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const cards = [
    {
      num: '01', type: 'Creators',
      title: 'Your stays. Your archive. Your income.',
      desc: "One clean profile that links every stay you've ever posted about. Your followers can book the exact place, and you earn every time they do.",
      benefit: 'Free & discounted stays · Affiliate commissions · Post once, earn forever',
    },
    {
      num: '02', type: 'Stay Owners',
      title: 'Reach. Content. Bookings.',
      desc: 'Get discovered by creator audiences who are already dreaming about your property. Receive authentic UGC. Pay only when bookings happen.',
      benefit: 'No upfront fees · Authentic content · Performance-based only',
    },
    {
      num: '03', type: 'Travelers',
      title: 'Book exactly what inspired you.',
      desc: "No guessing. No endless scrolling. See a place on Instagram and book it in one click, guided by someone whose taste you already trust.",
      benefit: 'Trust-led discovery · No catfishing · Curated, not algorithmic',
    },
  ]

  return (
    <>
      <div className="divider">
        <div className="divider-line" />
        <div className="divider-text">Built for three kinds of people</div>
        <div className="divider-line" />
      </div>
      <section className="section" id="how">
        <div className="section-label fade-in-section">The model</div>
        <h2 className="section-title fade-in-section">
          A marketplace where <em>everyone wins</em> when a booking happens.
        </h2>
        <div className="three-col fade-in-section">
          {cards.map(card => (
            <div className="audience-card" key={card.num}>
              <div className="audience-num">{card.num}</div>
              <div className="audience-type">{card.type}</div>
              <div className="audience-title">{card.title}</div>
              <div className="audience-desc">{card.desc}</div>
              <div className="audience-benefit">{card.benefit}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function CreatorProfiles({ onOpenModal }) {
  return (
    <section className="profiles-section" id="creators">
      <div className="profiles-header fade-in-section">
        <div>
          <div className="section-label">Creator profiles</div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            A permanent, bookable<br />archive of <em>everywhere they&apos;ve stayed.</em>
          </h2>
        </div>
        <a href="#waitlist" className="btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={(e) => { e.preventDefault(); scrollTo('waitlist') }}>
          Apply as creator
        </a>
      </div>
      <div className="profiles-grid fade-in-section">
        {CREATORS.map(creator => (
          <div
            className="profile-card"
            key={creator.name}
            onClick={() => onOpenModal(creator.modal.name, creator.modal.loc, creator.modal.price, creator.name, creator.avatar)}
          >
            <div className="profile-cover" style={{ backgroundImage: `url('${creator.cover}')` }} />
            <div className="profile-info">
              <div className="profile-avatar-wrap">
                <div className="profile-avatar" style={{ backgroundImage: `url('${creator.avatar}')` }} />
                <div className="verified-badge">Via Creator</div>
              </div>
              <div className="profile-name">{creator.name}</div>
              <div className="profile-handle">{creator.handle}</div>
              <div className="profile-stays">
                {creator.stays.map(s => <span className="stay-pill" key={s}>{s}</span>)}
              </div>
              <div className="profile-stats">
                {creator.stats.map(s => (
                  <div className="stat" key={s.label}>
                    <div className="stat-num">{s.num}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function StaySection({ onOpenModal }) {
  return (
    <section className="stay-section" id="stays">
      <div className="stay-images fade-in-section">
        <div className="stay-img" />
        <div className="stay-img" />
        <div className="stay-img" />
      </div>
      <div className="stay-details fade-in-section">
        <div className="section-label">Bookable stay page</div>
        <div className="stayed-by">
          <div className="stayed-by-avatar" />
          <div className="stayed-by-text">
            Stayed here by <strong>Camille Laurent</strong> · January 2025
          </div>
        </div>
        <h2 className="stay-name">Hôtel Le Pigonnet</h2>
        <div className="stay-location">Aix-en-Provence, France</div>
        <p className="stay-desc">
          A 19th-century bastide nestled in a private garden, steps from the Cours Mirabeau.
          Camille spent four days here in January and called it &ldquo;the most quietly beautiful
          hotel I&apos;ve ever stayed in.&rdquo;
        </p>
        <div className="pricing-block">
          <div className="price">€385</div>
          <div className="price-per">/ night · avg. 3 nights</div>
        </div>
        <button
          className="book-btn"
          onClick={() => onOpenModal(
            'Hôtel Le Pigonnet',
            'Aix-en-Provence, France',
            '€385',
            'Camille Laurent',
            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&q=80'
          )}
        >
          Book via Camille
        </button>
        <div className="attribution-note">10% goes to <span>Camille</span> · No Airbnb fees</div>
      </div>
    </section>
  )
}

function Manifesto() {
  return (
    <section className="manifesto">
      <div className="manifesto-lines">
        <div className="manifesto-line">Intuition over algorithms.</div>
        <div className="manifesto-line">Taste over volume.</div>
        <div className="manifesto-line"><em>Trust over ads.</em></div>
        <div className="manifesto-line muted" style={{ marginTop: '48px' }}>
          Travel works best when it&apos;s guided<br />by people you already trust.
        </div>
      </div>
    </section>
  )
}

function Waitlist({ showToast }) {
  const [activeTab, setActiveTab] = useState('creator')

  const handleSubmit = (e) => {
    e.preventDefault()
    showToast("✓ You're on the list — we'll be in touch.")
    e.target.reset()
  }

  return (
    <section className="waitlist-section" id="waitlist">
      <div className="waitlist-left fade-in-section">
        <div className="section-label">Early access</div>
        <h2 className="section-title" style={{ marginBottom: '16px' }}>
          Via is invite-only<br />to start. <em>By design.</em>
        </h2>
        <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--muted)' }}>
          We&apos;re onboarding a hand-selected group of creators and boutique stay owners.
          Quality over scale — always.
        </p>
      </div>
      <div className="waitlist-right fade-in-section">
        <div className="waitlist-tabs">
          {[['creator', "I'm a Creator"], ['owner', "I'm a Stay Owner"], ['traveler', "I'm a Traveler"]].map(([type, label]) => (
            <button
              key={type}
              className={`tab${activeTab === type ? ' active' : ''}`}
              onClick={() => setActiveTab(type)}
            >
              {label}
            </button>
          ))}
        </div>
        <form className="waitlist-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First name</label>
              <input type="text" placeholder="Camille" required />
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input type="text" placeholder="Laurent" required />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="camille@example.com" required />
          </div>
          {activeTab === 'creator' && (
            <div className="form-group">
              <label>Instagram / TikTok handle</label>
              <input type="text" placeholder="@handle" />
            </div>
          )}
          {activeTab === 'owner' && (
            <div className="form-group">
              <label>Property name</label>
              <input type="text" placeholder="Hôtel de la Paix" />
            </div>
          )}
          <div className="form-group">
            <label>Where do you travel / host?</label>
            <input type="text" placeholder="Europe, Asia, Americas..." />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '16px', fontSize: '13px', letterSpacing: '0.1em' }}
          >
            Request access →
          </button>
        </form>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer>
      <div>
        <div className="footer-logo">V<span>.</span>ia</div>
        <div className="footer-tagline">Travel by way of trust.</div>
      </div>
      <div className="footer-links">
        <a href="#">For Creators</a>
        <a href="#">For Owners</a>
        <a href="#">For Travelers</a>
        <a href="#">Manifesto</a>
      </div>
    </footer>
  )
}

export default function App() {
  const [modal, setModal] = useState({ isOpen: false, stay: null })
  const [toast, setToast] = useState({ show: false, message: '' })

  useFadeInObserver()

  const openModal = (name, loc, price, creator, avatar) => {
    setModal({ isOpen: true, stay: { name, loc, price, creator, avatar } })
  }

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }))

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
  }

  const confirmBooking = () => {
    closeModal()
    showToast('✓ Redirecting to booking — via Via.')
  }

  return (
    <>
      <Nav />
      <Hero onOpenModal={openModal} />
      <HowItWorks />
      <CreatorProfiles onOpenModal={openModal} />
      <StaySection onOpenModal={openModal} />
      <Manifesto />
      <Waitlist showToast={showToast} />
      <Footer />
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        stay={modal.stay}
        onConfirm={confirmBooking}
      />
      <Toast message={toast.message} show={toast.show} />
    </>
  )
}
