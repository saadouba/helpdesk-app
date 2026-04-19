import { useMemo, useState } from 'react'
import './App.css'
import supabase from './supabaseClient'

const categories = ['Hardware', 'Software', 'Network', 'Access', 'Other']
const priorities = ['Low', 'Medium', 'High', 'Critical']
const statuses = ['All', 'Open', 'In Progress', 'Resolved']

/** Extract Low | Medium | High | Critical from model text (order: longest label first). */
function parsePriorityFromModelReply(text) {
  if (!text || typeof text !== 'string') return null
  const cleaned = text.replace(/[*#`"']/g, ' ')
  for (const p of ['Critical', 'High', 'Medium', 'Low']) {
    if (new RegExp(`\\b${p}\\b`, 'i').test(cleaned)) return p
  }
  return null
}

const createInitialForm = () => ({
  name: '',
  email: '',
  category: 'Hardware',
  priority: 'Medium',
  subject: '',
  description: '',
})

function App() {
  const [formData, setFormData] = useState(createInitialForm)
  const [tickets, setTickets] = useState([])
  const [statusFilter, setStatusFilter] = useState('All')

  const visibleTickets = useMemo(() => {
    if (statusFilter === 'All') {
      return tickets
    }
    return tickets.filter((ticket) => ticket.status === statusFilter)
  }, [statusFilter, tickets])

  const openCount = useMemo(
    () => tickets.filter((t) => t.status === 'Open').length,
    [tickets]
  )

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function suggestPriorityFromDescription(descriptionText) {
    const trimmed = descriptionText.trim()
    if (!trimmed) return

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    if (!apiKey) {
      console.warn('VITE_OPENROUTER_API_KEY is not set')
      return
    }

    const userContent =
      'Based on this IT ticket description, reply with only one word — Low, Medium, High, or Critical.\n\n' +
      `Description:\n${trimmed}`

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemma-3-4b-it:free',
          messages: [{ role: 'user', content: userContent }],
        }),
      })

      if (!response.ok) {
        const errBody = await response.text()
        console.error('OpenRouter request failed:', response.status, errBody)
        return
      }

      const data = await response.json()
      const raw = data.choices?.[0]?.message?.content
      const suggested = parsePriorityFromModelReply(String(raw ?? '').trim())

      if (suggested && priorities.includes(suggested)) {
        setFormData((current) => ({ ...current, priority: suggested }))
      }
    } catch (err) {
      console.error('OpenRouter fetch failed:', err)
    }
  }

  const generateTicketId = () => {
    const randomPart = Math.floor(Math.random() * 900 + 100)
    return `HD-${Date.now().toString().slice(-6)}-${randomPart}`
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextStatus = 'Open'
    const ticketId = generateTicketId()
    const newTicket = {
      id: ticketId,
      ...formData,
      status: nextStatus,
      createdAt: new Date().toLocaleString(),
    }

    try {
      const { error } = await supabase.from('tickets').insert({
        ticket_id: ticketId,
        name: formData.name,
        email: formData.email,
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject,
        description: formData.description,
        status: nextStatus,
      })

      if (error) throw error

      setTickets((current) => [newTicket, ...current])
      setFormData(createInitialForm())
    } catch (err) {
      console.error('Failed to insert ticket:', err)
      alert('Failed to submit ticket. Please try again.')
    }
  }

  const updateTicketStatus = (ticketId, nextStatus) => {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: nextStatus } : ticket
      )
    )
  }

  return (
    <main className="it-dashboard">
      <div className="it-dashboard__ambient" aria-hidden="true" />

      <header className="it-dashboard__hero">
        <div className="it-dashboard__hero-main">
          <div className="it-dashboard__brand">
            <span className="it-dashboard__brand-mark" aria-hidden="true" />
            <div>
              <p className="it-dashboard__eyebrow">Enterprise IT Operations</p>
              <h1 className="it-dashboard__title">Service Desk Console</h1>
              <p className="it-dashboard__subtitle">
                Submit support requests, triage by status, and keep your queue under control in one
                view.
              </p>
            </div>
          </div>
        </div>

        <div className="it-dashboard__stats" role="region" aria-label="Queue summary">
          <article className="it-stat it-stat--enter">
            <span className="it-stat__label">Total tickets</span>
            <span className="it-stat__value">{tickets.length}</span>
            <span className="it-stat__hint">This session</span>
          </article>
          <article className="it-stat it-stat--enter it-stat--delay-1">
            <span className="it-stat__label">Open</span>
            <span className="it-stat__value">{openCount}</span>
            <span className="it-stat__hint">Awaiting action</span>
          </article>
          <article className="it-stat it-stat--enter it-stat--delay-2">
            <span className="it-stat__label">In view</span>
            <span className="it-stat__value">{visibleTickets.length}</span>
            <span className="it-stat__hint">
              Filter: <strong>{statusFilter}</strong>
            </span>
          </article>
        </div>
      </header>

      <div className="it-dashboard__grid">
        <section className="it-panel it-panel--form card">
          <div className="it-panel__head">
            <h2 className="it-panel__title">New ticket</h2>
            <p className="it-panel__desc">
              Capture requester details and context. Priority can be suggested when you leave the
              description field.
            </p>
          </div>

          <form className="ticket-form" onSubmit={handleSubmit}>
            <label>
              <span className="field-label">Requester name</span>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleFieldChange}
                placeholder="Alex Johnson"
              />
            </label>

            <label>
              <span className="field-label">Work email</span>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFieldChange}
                placeholder="alex@company.com"
              />
            </label>

            <label>
              <span className="field-label">Category</span>
              <select name="category" value={formData.category} onChange={handleFieldChange}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="field-label">Priority</span>
              <select name="priority" value={formData.priority} onChange={handleFieldChange}>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <label className="full-width">
              <span className="field-label">Subject</span>
              <input
                required
                name="subject"
                value={formData.subject}
                onChange={handleFieldChange}
                placeholder="Cannot connect to VPN"
              />
            </label>

            <label className="full-width">
              <span className="field-label">Description</span>
              <textarea
                required
                name="description"
                value={formData.description}
                onChange={handleFieldChange}
                onBlur={(event) => {
                  void suggestPriorityFromDescription(event.target.value)
                }}
                rows={4}
                placeholder="Provide details, error messages, and steps already tried."
              />
            </label>

            <button type="submit" className="submit-btn">
              <span>Submit ticket</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 12h14m-4 4 4-4-4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </section>

        <section className="it-panel it-panel--queue card">
          <div className="queue-header">
            <div>
              <h2 className="it-panel__title it-panel__title--inline">Live queue</h2>
              <p className="it-panel__desc it-panel__desc--tight">
                Filter by lifecycle status. Updates apply to this session immediately.
              </p>
            </div>
            <div className="filter-group" role="group" aria-label="Filter by status">
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={statusFilter === status ? 'filter active' : 'filter'}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {visibleTickets.length === 0 ? (
            <div className="empty-state" role="status">
              <div className="empty-state__icon" aria-hidden="true" />
              <p className="empty-state__text">No tickets match this filter.</p>
              <p className="empty-state__sub">Submit a new ticket or choose a different status.</p>
            </div>
          ) : (
            <ul className="ticket-list">
              {visibleTickets.map((ticket, index) => (
                <li
                  key={ticket.id}
                  className="ticket-item"
                  style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
                >
                  <div className="ticket-top">
                    <span className="ticket-id">{ticket.id}</span>
                    <span className={`pill priority-${ticket.priority.toLowerCase()}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h3>{ticket.subject}</h3>
                  <p className="ticket-body">{ticket.description}</p>
                  <div className="ticket-meta">
                    <span className="ticket-chip">{ticket.name}</span>
                    <span className="ticket-chip ticket-chip--mono">{ticket.email}</span>
                    <span className="ticket-chip">{ticket.category}</span>
                    <span className="ticket-chip ticket-chip--muted">{ticket.createdAt}</span>
                  </div>
                  <div className="status-row">
                    <label>
                      <span className="field-label">Status</span>
                      <select
                        value={ticket.status}
                        onChange={(event) =>
                          updateTicketStatus(ticket.id, event.target.value)
                        }
                      >
                        {statuses
                          .filter((status) => status !== 'All')
                          .map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
