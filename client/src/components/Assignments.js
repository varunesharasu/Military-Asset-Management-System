"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import "../styles/Assignments.css"

const Assignments = () => {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("create")
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)

  // Filters
  const [filters, setFilters] = useState({
    base: "",
    assetType: "",
    status: "",
    personnelName: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
  })

  // Form data
  const [formData, setFormData] = useState({
    assetType: "",
    assetName: "",
    quantity: "",
    personnelName: "",
    personnelRank: "",
    personnelId: "",
    purpose: "",
    expectedReturnDate: "",
    notes: "",
    base: user?.base || "",
  })

  // Status update data
  const [statusData, setStatusData] = useState({
    status: "",
    returnQuantity: "",
    expendQuantity: "",
    notes: "",
  })

  const [pagination, setPagination] = useState({})

  useEffect(() => {
    fetchAssignments()
    fetchStats()
  }, [filters])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })

      const response = await fetch(`/api/assignments?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments)
        setPagination(data.pagination)
      } else {
        setError("Failed to fetch assignments")
      }
    } catch (err) {
      setError("Error fetching assignments")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/assignments/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowModal(false)
        resetForm()
        fetchAssignments()
        fetchStats()
      } else {
        const errorData = await response.json()
        setError(errorData.message)
      }
    } catch (err) {
      setError("Error creating assignment")
    }
  }

  const handleStatusUpdate = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/assignments/${selectedAssignment._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(statusData),
      })

      if (response.ok) {
        setShowStatusModal(false)
        setSelectedAssignment(null)
        resetStatusForm()
        fetchAssignments()
        fetchStats()
      } else {
        const errorData = await response.json()
        setError(errorData.message)
      }
    } catch (err) {
      setError("Error updating assignment status")
    }
  }

  const resetForm = () => {
    setFormData({
      assetType: "",
      assetName: "",
      quantity: "",
      personnelName: "",
      personnelRank: "",
      personnelId: "",
      purpose: "",
      expectedReturnDate: "",
      notes: "",
      base: user?.base || "",
    })
  }

  const resetStatusForm = () => {
    setStatusData({
      status: "",
      returnQuantity: "",
      expendQuantity: "",
      notes: "",
    })
  }

  const openStatusModal = (assignment, status) => {
    setSelectedAssignment(assignment)
    setStatusData({
      status,
      returnQuantity: status === "returned" ? assignment.quantity : "",
      expendQuantity: status === "expended" ? assignment.quantity : "",
      notes: "",
    })
    setShowStatusModal(true)
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: "status-badge status-active",
      returned: "status-badge status-returned",
      expended: "status-badge status-expended",
      partial_return: "status-badge status-partial",
    }

    const statusLabels = {
      active: "Active",
      returned: "Returned",
      expended: "Expended",
      partial_return: "Partial Return",
    }

    return <span className={statusClasses[status]}>{statusLabels[status]}</span>
  }

  const canManageAssignments = user?.role === "admin" || user?.role === "base_commander"

  return (
    <div className="assignments-container">
      <div className="page-header">
        <h2>Asset Assignments</h2>
        <p>Assign assets to personnel and track expenditures</p>
        {canManageAssignments && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setModalType("create")
              setShowModal(true)
            }}
          >
            New Assignment
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.overview?.totalAssignments || 0}</h3>
          <p>Total Assignments</p>
        </div>
        <div className="stat-card">
          <h3>{stats.overview?.activeAssignments || 0}</h3>
          <p>Active Assignments</p>
        </div>
        <div className="stat-card">
          <h3>{stats.overview?.expendedAssets || 0}</h3>
          <p>Expended Assets</p>
        </div>
        <div className="stat-card">
          <h3>{stats.overview?.returnedAssets || 0}</h3>
          <p>Returned Assets</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          {user?.role === "admin" && (
            <select value={filters.base} onChange={(e) => setFilters({ ...filters, base: e.target.value, page: 1 })}>
              <option value="">All Bases</option>
              <option value="Base Alpha">Base Alpha</option>
              <option value="Base Beta">Base Beta</option>
              <option value="Base Gamma">Base Gamma</option>
            </select>
          )}

          <select
            value={filters.assetType}
            onChange={(e) => setFilters({ ...filters, assetType: e.target.value, page: 1 })}
          >
            <option value="">All Asset Types</option>
            <option value="Weapons">Weapons</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Equipment">Equipment</option>
            <option value="Ammunition">Ammunition</option>
          </select>

          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
            <option value="expended">Expended</option>
            <option value="partial_return">Partial Return</option>
          </select>

          <input
            type="text"
            placeholder="Personnel Name"
            value={filters.personnelName}
            onChange={(e) => setFilters({ ...filters, personnelName: e.target.value, page: 1 })}
          />

          <input
            type="date"
            placeholder="From Date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
          />

          <input
            type="date"
            placeholder="To Date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
          />
        </div>
      </div>

      {/* Assignments Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Loading assignments...</div>
        ) : (
          <table className="assignments-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Personnel</th>
                <th>Quantity</th>
                <th>Assigned Date</th>
                <th>Status</th>
                <th>Purpose</th>
                {canManageAssignments && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment._id}>
                  <td>
                    <div className="asset-info">
                      <strong>{assignment.assetName}</strong>
                      <small>{assignment.assetType}</small>
                    </div>
                  </td>
                  <td>
                    <div className="personnel-info">
                      <strong>
                        {assignment.personnelRank} {assignment.personnelName}
                      </strong>
                      <small>ID: {assignment.personnelId}</small>
                    </div>
                  </td>
                  <td>
                    <div className="quantity-info">
                      <strong>{assignment.quantity}</strong>
                      {assignment.returnedQuantity > 0 && <small>Returned: {assignment.returnedQuantity}</small>}
                      {assignment.expendedQuantity > 0 && <small>Expended: {assignment.expendedQuantity}</small>}
                    </div>
                  </td>
                  <td>{new Date(assignment.assignedDate).toLocaleDateString()}</td>
                  <td>{getStatusBadge(assignment.status)}</td>
                  <td>{assignment.purpose}</td>
                  {canManageAssignments && (
                    <td>
                      <div className="action-buttons">
                        {assignment.status === "active" && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => openStatusModal(assignment, "returned")}
                            >
                              Return
                            </button>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => openStatusModal(assignment, "expended")}
                            >
                              Expend
                            </button>
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => openStatusModal(assignment, "partial_return")}
                            >
                              Partial
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.current === 1}
            onClick={() => setFilters({ ...filters, page: pagination.current - 1 })}
          >
            Previous
          </button>
          <span>
            Page {pagination.current} of {pagination.pages}
          </span>
          <button
            disabled={pagination.current === pagination.pages}
            onClick={() => setFilters({ ...filters, page: pagination.current + 1 })}
          >
            Next
          </button>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>New Assignment</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {user?.role === "admin" && (
                  <div className="form-group">
                    <label>Base</label>
                    <select
                      value={formData.base}
                      onChange={(e) => setFormData({ ...formData, base: e.target.value })}
                      required
                    >
                      <option value="">Select Base</option>
                      <option value="Base Alpha">Base Alpha</option>
                      <option value="Base Beta">Base Beta</option>
                      <option value="Base Gamma">Base Gamma</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Asset Type</label>
                  <select
                    value={formData.assetType}
                    onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Weapons">Weapons</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Ammunition">Ammunition</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Asset Name</label>
                  <input
                    type="text"
                    value={formData.assetName}
                    onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Personnel Name</label>
                  <input
                    type="text"
                    value={formData.personnelName}
                    onChange={(e) => setFormData({ ...formData, personnelName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Personnel Rank</label>
                  <select
                    value={formData.personnelRank}
                    onChange={(e) => setFormData({ ...formData, personnelRank: e.target.value })}
                    required
                  >
                    <option value="">Select Rank</option>
                    <option value="Private">Private</option>
                    <option value="Corporal">Corporal</option>
                    <option value="Sergeant">Sergeant</option>
                    <option value="Lieutenant">Lieutenant</option>
                    <option value="Captain">Captain</option>
                    <option value="Major">Major</option>
                    <option value="Colonel">Colonel</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Personnel ID</label>
                  <input
                    type="text"
                    value={formData.personnelId}
                    onChange={(e) => setFormData({ ...formData, personnelId: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Purpose</label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Expected Return Date</label>
                  <input
                    type="date"
                    value={formData.expectedReturnDate}
                    onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedAssignment && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Update Assignment Status</h3>
              <button className="close-btn" onClick={() => setShowStatusModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleStatusUpdate}>
              <div className="assignment-details">
                <p>
                  <strong>Asset:</strong> {selectedAssignment.assetName}
                </p>
                <p>
                  <strong>Personnel:</strong> {selectedAssignment.personnelRank} {selectedAssignment.personnelName}
                </p>
                <p>
                  <strong>Assigned Quantity:</strong> {selectedAssignment.quantity}
                </p>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={statusData.status}
                  onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="returned">Returned</option>
                  <option value="expended">Expended</option>
                  <option value="partial_return">Partial Return</option>
                </select>
              </div>

              {statusData.status === "returned" && (
                <div className="form-group">
                  <label>Return Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedAssignment.quantity}
                    value={statusData.returnQuantity}
                    onChange={(e) => setStatusData({ ...statusData, returnQuantity: e.target.value })}
                    required
                  />
                </div>
              )}

              {statusData.status === "expended" && (
                <div className="form-group">
                  <label>Expend Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedAssignment.quantity}
                    value={statusData.expendQuantity}
                    onChange={(e) => setStatusData({ ...statusData, expendQuantity: e.target.value })}
                    required
                  />
                </div>
              )}

              {statusData.status === "partial_return" && (
                <>
                  <div className="form-group">
                    <label>Return Quantity</label>
                    <input
                      type="number"
                      min="0"
                      max={selectedAssignment.quantity}
                      value={statusData.returnQuantity}
                      onChange={(e) => setStatusData({ ...statusData, returnQuantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Expend Quantity</label>
                    <input
                      type="number"
                      min="0"
                      max={selectedAssignment.quantity}
                      value={statusData.expendQuantity}
                      onChange={(e) => setStatusData({ ...statusData, expendQuantity: e.target.value })}
                      required
                    />
                  </div>
                  <small>Total must equal {selectedAssignment.quantity}</small>
                </>
              )}

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={statusData.notes}
                  onChange={(e) => setStatusData({ ...statusData, notes: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Assignments
