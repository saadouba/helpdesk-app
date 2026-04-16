import { useMemo, useState } from 'react'
import './App.css'

const categories = ['Hardware', 'Software', 'Network', 'Access', 'Other']
const priorities = ['Low', 'Medium', 'High', 'Critical']
const statuses = ['All', 'Open', 'In Progress', 'Resolved']

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

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const generateTicketId = () => {
    const randomPart = Math.floor(Math.random() * 900 + 100)
    return `HD-${Date.now().toString().slice(-6)}-${randomPart}`
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const newTicket = {
      id: generateTicketId(),
      ...formData,
      status: 'Open',
      createdAt: new Date().toLocaleString(),
    }

    setTickets((current) => [newTicket, ...current])
    setFormData(createInitialForm())
  }

  const updateTicketStatus = (ticketId, nextStatus) => {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: nextStatus } : ticket
      )
    )
  }

  return (
    <main className="helpdesk-layout">
      <header className="page-header">
        <h1>IT Helpdesk Ticket System</h1>
        <p>Submit support requests and track progress across your queue.</p>
      </header>

      <section className="card">
        <h2>Create Ticket</h2>
        <form className="ticket-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              required
              name="name"
              value={formData.name}
              onChange={handleFieldChange}
              placeholder="Alex Johnson"
            />
          </label>

          <label>
            Email
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
            Category
            <select
              name="category"
              value={formData.category}
              onChange={handleFieldChange}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select
              name="priority"
              value={formData.priority}
              onChange={handleFieldChange}
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>

          <label className="full-width">
            Subject
            <input
              required
              name="subject"
              value={formData.subject}
              onChange={handleFieldChange}
              placeholder="Cannot connect to VPN"
            />
          </label>

          <label className="full-width">
            Description
            <textarea
              required
              name="description"
              value={formData.description}
              onChange={handleFieldChange}
              rows={4}
              placeholder="Provide details, error messages, and steps already tried."
            />
          </label>

          <button type="submit" className="submit-btn">
            Submit Ticket
          </button>
        </form>
      </section>

      <section className="card">
        <div className="queue-header">
          <h2>Ticket Queue</h2>
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
          <p className="empty-state">No tickets found for this filter.</p>
        ) : (
          <ul className="ticket-list">
            {visibleTickets.map((ticket) => (
              <li key={ticket.id} className="ticket-item">
                <div className="ticket-top">
                  <span className="ticket-id">{ticket.id}</span>
                  <span className={`pill priority-${ticket.priority.toLowerCase()}`}>
                    {ticket.priority}
                  </span>
                </div>
                <h3>{ticket.subject}</h3>
                <p>{ticket.description}</p>
                <div className="ticket-meta">
                  <span>{ticket.name}</span>
                  <span>{ticket.email}</span>
                  <span>{ticket.category}</span>
                  <span>{ticket.createdAt}</span>
                </div>
                <div className="status-row">
                  <label>
                    Status
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
    </main>
  )
}

export default App
