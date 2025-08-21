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
  const [refreshing, setRefreshing] = useState(false)

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

  // Enhanced refresh function
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchAssignments(), fetchStats()])
    setRefreshing(false)
  }

  return (
    <div className="assignments-container">
      {/* Enhanced Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2>Asset Assignments</h2>
            <p>Assign assets to personnel and track expenditures in real-time</p>
          </div>
          <div className="header-actions">
            <button 
              className={`btn btn-refresh ${refreshing ? 'refreshing' : ''}`} 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <span className="btn-icon">🔄</span>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            {canManageAssignments && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setModalType("create")
                  setShowModal(true)
                }}
              >
                <span className="btn-icon">➕</span>
                New Assignment
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* Enhanced Statistics Cards */}
      <div className="stats-section">
        <div className="stats-header">
          <h3>Assignment Overview</h3>
          <div className="live-indicator">
            <span className="status-dot"></span>
            <span>Live Data</span>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{stats.overview?.totalAssignments || 0}</div>
              <div className="stat-label">Total Assignments</div>
              <div className="stat-trend">All time records</div>
            </div>
          </div>
          <div className="stat-card active">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-value">{stats.overview?.activeAssignments || 0}</div>
              <div className="stat-label">Active Assignments</div>
              <div className="stat-trend">Currently deployed</div>
            </div>
          </div>
          <div className="stat-card expended">
            <div className="stat-icon">📤</div>
            <div className="stat-content">
              <div className="stat-value">{stats.overview?.expendedAssets || 0}</div>
              <div className="stat-label">Expended Assets</div>
              <div className="stat-trend">Mission consumed</div>
            </div>
          </div>
          <div className="stat-card returned">
            <div className="stat-icon">📥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.overview?.returnedAssets || 0}</div>
              <div className="stat-label">Returned Assets</div>
              <div className="stat-trend">Recovered items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filter & Search</h3>
          <button 
            className="btn btn-outline"
            onClick={() => setFilters({
              base: "",
              assetType: "",
              status: "",
              personnelName: "",
              dateFrom: "",
              dateTo: "",
              page: 1,
            })}
          >
            Clear All
          </button>
        </div>
        <div className="filters-grid">
          {user?.role === "admin" && (
            <div className="filter-group">
              <label className="filter-label">
                <span className="label-text">Base</span>
                <span className="label-icon">🏢</span>
              </label>
              <select 
                value={filters.base} 
                onChange={(e) => setFilters({ ...filters, base: e.target.value, page: 1 })}
                className="filter-select"
              >
                <option value="">All Bases</option>
                <option value="Base Alpha">Base Alpha</option>
                <option value="Base Beta">Base Beta</option>
                <option value="Base Gamma">Base Gamma</option>
              </select>
            </div>
          )}

          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">Asset Type</span>
              <span className="label-icon">🏷️</span>
            </label>
            <select
              value={filters.assetType}
              onChange={(e) => setFilters({ ...filters, assetType: e.target.value, page: 1 })}
              className="filter-select"
            >
              <option value="">All Asset Types</option>
              <option value="Weapons">Weapons</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Equipment">Equipment</option>
              <option value="Ammunition">Ammunition</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">Status</span>
              <span className="label-icon">📊</span>
            </label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="returned">Returned</option>
              <option value="expended">Expended</option>
              <option value="partial_return">Partial Return</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">Personnel</span>
              <span className="label-icon">👤</span>
            </label>
            <input
              type="text"
              placeholder="Personnel Name"
              value={filters.personnelName}
              onChange={(e) => setFilters({ ...filters, personnelName: e.target.value, page: 1 })}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">From Date</span>
              <span className="label-icon">📅</span>
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">To Date</span>
              <span className="label-icon">📅</span>
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Assignments Table */}
      <div className="assignments-section">
        <div className="section-header">
          <h3>Assignment Records</h3>
          <div className="table-info">
            <span className="record-count">{pagination.total || assignments.length} records</span>
            <div className="view-options">
              <button className="view-btn active">📋</button>
              <button className="view-btn">📊</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <p>Loading assignment data...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <div className="table-wrapper">
                <table className="assignments-table">
                  <thead>
                    <tr>
                      <th>Asset Details</th>
                      <th>Personnel Info</th>
                      <th>Quantity</th>
                      <th>Assignment Date</th>
                      <th>Status</th>
                      <th>Purpose</th>
                      {canManageAssignments && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment, index) => (
                      <tr key={assignment._id} style={{animationDelay: `${index * 0.05}s`}}>
                        <td>
                          <div className="asset-info">
                            <div className="asset-name">{assignment.assetName}</div>
                            <div className="asset-type">
                              <span className="type-badge">{assignment.assetType}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="personnel-info">
                            <div className="personnel-name">
                              {assignment.personnelRank} {assignment.personnelName}
                            </div>
                            <div className="personnel-id">ID: {assignment.personnelId}</div>
                          </div>
                        </td>
                        <td>
                          <div className="quantity-info">
                            <div className="quantity-main">{assignment.quantity}</div>
                            <div className="quantity-details">
                              {assignment.returnedQuantity > 0 && (
                                <span className="quantity-returned">↩️ {assignment.returnedQuantity}</span>
                              )}
                              {assignment.expendedQuantity > 0 && (
                                <span className="quantity-expended">📤 {assignment.expendedQuantity}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="date-info">
                            <span className="date-value">
                              {new Date(assignment.assignedDate).toLocaleDateString()}
                            </span>
                            <span className="date-time">
                              {new Date(assignment.assignedDate).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-${assignment.status.replace('_', '-')}`}>
                            <span className="status-icon"></span>
                            {assignment.status === 'partial_return' ? 'Partial Return' : 
                             assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="purpose-info">
                            {assignment.purpose}
                          </div>
                        </td>
                        {canManageAssignments && (
                          <td>
                            <div className="action-buttons">
                              {assignment.status === "active" && (
                                <>
                                  <button
                                    className="action-btn return"
                                    onClick={() => openStatusModal(assignment, "returned")}
                                    title="Mark as Returned"
                                  >
                                    📥
                                  </button>
                                  <button
                                    className="action-btn expend"
                                    onClick={() => openStatusModal(assignment, "expended")}
                                    title="Mark as Expended"
                                  >
                                    📤
                                  </button>
                                  <button
                                    className="action-btn partial"
                                    onClick={() => openStatusModal(assignment, "partial_return")}
                                    title="Partial Return"
                                  >
                                    ⚖️
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
              </div>
            </div>

            {/* Enhanced Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={pagination.current === 1}
                  onClick={() => setFilters({ ...filters, page: pagination.current - 1 })}
                >
                  <span>‹</span>
                  Previous
                </button>
                
                <div className="pagination-info">
                  <span className="page-numbers">
                    Page <strong>{pagination.current}</strong> of <strong>{pagination.pages}</strong>
                  </span>
                  <span className="total-records">
                    ({pagination.total} total records)
                  </span>
                </div>
                
                <button
                  className="pagination-btn"
                  disabled={pagination.current === pagination.pages}
                  onClick={() => setFilters({ ...filters, page: pagination.current + 1 })}
                >
                  Next
                  <span>›</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Enhanced Create Assignment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon">➕</span>
                <h3>New Assignment</h3>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="assignment-form">
                <div className="form-section">
                  <h4 className="section-title">Asset Information</h4>
                  <div className="form-grid">
                    {user?.role === "admin" && (
                      <div className="form-group">
                        <label className="form-label">
                          <span className="label-text">Base</span>
                          <span className="required">*</span>
                        </label>
                        <select
                          value={formData.base}
                          onChange={(e) => setFormData({ ...formData, base: e.target.value })}
                          className="form-control"
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
                      <label className="form-label">
                        <span className="label-text">Asset Type</span>
                        <span className="required">*</span>
                      </label>
                      <select
                        value={formData.assetType}
                        onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                        className="form-control"
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
                      <label className="form-label">
                        <span className="label-text">Asset Name</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.assetName}
                        onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                        className="form-control"
                        required
                        placeholder="Enter asset name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Quantity</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="form-control"
                        required
                        placeholder="Enter quantity"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4 className="section-title">Personnel Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Personnel Name</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.personnelName}
                        onChange={(e) => setFormData({ ...formData, personnelName: e.target.value })}
                        className="form-control"
                        required
                        placeholder="Enter personnel name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Personnel Rank</span>
                        <span className="required">*</span>
                      </label>
                      <select
                        value={formData.personnelRank}
                        onChange={(e) => setFormData({ ...formData, personnelRank: e.target.value })}
                        className="form-control"
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
                      <label className="form-label">
                        <span className="label-text">Personnel ID</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.personnelId}
                        onChange={(e) => setFormData({ ...formData, personnelId: e.target.value })}
                        className="form-control"
                        required
                        placeholder="Enter personnel ID"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Purpose</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        className="form-control"
                        required
                        placeholder="Assignment purpose"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4 className="section-title">Additional Details</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Expected Return Date</span>
                      </label>
                      <input
                        type="date"
                        value={formData.expectedReturnDate}
                        onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">
                      <span className="label-text">Notes</span>
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="form-control"
                      rows="3"
                      placeholder="Additional notes or comments (optional)"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <span className="btn-icon">➕</span>
                    Create Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Status Update Modal */}
      {showStatusModal && selectedAssignment && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon">🔄</span>
                <h3>Update Assignment Status</h3>
              </div>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="assignment-details">
                <div className="detail-card">
                  <h4>Assignment Details</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Asset:</span>
                      <span className="detail-value">{selectedAssignment.assetName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Personnel:</span>
                      <span className="detail-value">
                        {selectedAssignment.personnelRank} {selectedAssignment.personnelName}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Assigned Quantity:</span>
                      <span className="detail-value">{selectedAssignment.quantity}</span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleStatusUpdate} className="status-form">
                <div className="form-section">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-text">Status</span>
                      <span className="required">*</span>
                    </label>
                    <select
                      value={statusData.status}
                      onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                      className="form-control"
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
                      <label className="form-label">
                        <span className="label-text">Return Quantity</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedAssignment.quantity}
                        value={statusData.returnQuantity}
                        onChange={(e) => setStatusData({ ...statusData, returnQuantity: e.target.value })}
                        className="form-control"
                        required
                      />
                    </div>
                  )}

                  {statusData.status === "expended" && (
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Expend Quantity</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedAssignment.quantity}
                        value={statusData.expendQuantity}
                        onChange={(e) => setStatusData({ ...statusData, expendQuantity: e.target.value })}
                        className="form-control"
                        required
                      />
                    </div>
                  )}

                  {statusData.status === "partial_return" && (
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">
                          <span className="label-text">Return Quantity</span>
                          <span className="required">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={selectedAssignment.quantity}
                          value={statusData.returnQuantity}
                          onChange={(e) => setStatusData({ ...statusData, returnQuantity: e.target.value })}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          <span className="label-text">Expend Quantity</span>
                          <span className="required">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={selectedAssignment.quantity}
                          value={statusData.expendQuantity}
                          onChange={(e) => setStatusData({ ...statusData, expendQuantity: e.target.value })}
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="form-group full-width">
                        <small className="form-note">
                          Total must equal {selectedAssignment.quantity}
                        </small>
                      </div>
                    </div>
                  )}

                  <div className="form-group full-width">
                    <label className="form-label">
                      <span className="label-text">Notes</span>
                    </label>
                    <textarea
                      value={statusData.notes}
                      onChange={(e) => setStatusData({ ...statusData, notes: e.target.value })}
                      className="form-control"
                      rows="3"
                      placeholder="Additional notes about the status update"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <span className="btn-icon">💾</span>
                    Update Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Assignments
