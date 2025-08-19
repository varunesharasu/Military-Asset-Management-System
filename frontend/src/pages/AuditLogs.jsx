"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"

const AuditLogs = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 50,
  })
  const [summary, setSummary] = useState([])

  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    startDate: "",
    endDate: "",
    page: 1,
  })

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/auth/users")
      setUsers(response.data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchActions = async () => {
    try {
      const response = await axios.get("/api/logs/actions")
      setActions(response.data.actions || [])
    } catch (error) {
      console.error("Error fetching actions:", error)
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await axios.get("/api/logs", { params: filters })
      setLogs(response.data.logs)
      setPagination(response.data.pagination)
      setSummary(response.data.summary)
      setError("")
    } catch (error) {
      console.error("Error fetching audit logs:", error)
      setError("Failed to load audit logs")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }))
  }

  const clearFilters = () => {
    setFilters({
      userId: "",
      action: "",
      startDate: "",
      endDate: "",
      page: 1,
    })
  }

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatDetails = (details) => {
    if (typeof details === "object") {
      return JSON.stringify(details, null, 2)
    }
    return String(details)
  }

  const getActionBadgeClass = (action) => {
    if (action.includes("CREATED")) return "badge-success"
    if (action.includes("UPDATED")) return "badge-info"
    if (action.includes("DELETED")) return "badge-danger"
    if (action.includes("LOGIN")) return "badge-primary"
    return "badge-secondary"
  }

  useEffect(() => {
    if (user?.role === "Admin") {
      fetchUsers()
      fetchActions()
    }
  }, [])

  useEffect(() => {
    if (user?.role === "Admin") {
      fetchLogs()
    }
  }, [filters])

  if (user?.role !== "Admin") {
    return (
      <div className="text-center" style={{ padding: "40px" }}>
        <h2>Access Denied</h2>
        <p>You need administrator privileges to view audit logs.</p>
      </div>
    )
  }

  if (loading && logs.length === 0) {
    return <div className="loading">Loading audit logs...</div>
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(pagination.total)}</div>
          <div className="metric-label">Total Log Entries</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{summary.length}</div>
          <div className="metric-label">Unique Actions</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(users.length)}</div>
          <div className="metric-label">Active Users</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(actions.length)}</div>
          <div className="metric-label">Action Types</div>
        </div>
      </div>

      {/* Top Actions Summary */}
      {summary.length > 0 && (
        <div className="card mb-20">
          <h3>Top Actions (Current Filter)</h3>
          <div className="flex gap-10" style={{ flexWrap: "wrap" }}>
            {summary.slice(0, 5).map((item) => (
              <div key={item._id} className="flex-center gap-5">
                <span className={`badge ${getActionBadgeClass(item._id)}`}>{item._id}</span>
                <span>({formatNumber(item.count)})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <div className="filters-grid">
          <div className="filter-group">
            <label>User</label>
            <select name="userId" value={filters.userId} onChange={handleFilterChange} className="form-select">
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Action</label>
            <select name="action" value={filters.action} onChange={handleFilterChange} className="form-select">
              <option value="">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="datetime-local"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="datetime-local"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <button onClick={clearFilters} className="btn btn-outline" style={{ marginTop: "25px" }}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="flex-between mb-20">
        <h2>Audit Log Entries</h2>
      </div>

      <div className="card">
        {logs.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td>{formatDate(log.timestamp)}</td>
                      <td>
                        <div>
                          <div>{log.userId?.username || "Unknown User"}</div>
                          <small className={`badge badge-${log.userId?.role?.toLowerCase() || "secondary"}`}>
                            {log.userId?.role || "Unknown"}
                          </small>
                          {log.userId?.baseId?.name && (
                            <small className="text-muted"> - {log.userId.baseId.name}</small>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getActionBadgeClass(log.action)}`}>{log.action}</span>
                      </td>
                      <td>
                        <details>
                          <summary style={{ cursor: "pointer", color: "#2563eb" }}>View Details</summary>
                          <pre
                            style={{
                              fontSize: "12px",
                              background: "#f8f9fa",
                              padding: "8px",
                              borderRadius: "4px",
                              marginTop: "8px",
                              maxHeight: "200px",
                              overflow: "auto",
                            }}
                          >
                            {formatDetails(log.details)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex-center mt-20 gap-10">
                <button
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className="btn btn-outline"
                >
                  Previous
                </button>
                <span>
                  Page {pagination.current} of {pagination.pages} ({formatNumber(pagination.total)} total)
                </span>
                <button
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current === pagination.pages}
                  className="btn btn-outline"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center" style={{ padding: "40px" }}>
            <p>No audit logs found for the selected criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLogs
