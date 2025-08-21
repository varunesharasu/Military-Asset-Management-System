"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import axios from "axios"
import "../styles/Transfers.css"

const Transfers = () => {
  const { user } = useAuth()
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState(null)
  const [stats, setStats] = useState(null)
  const [bases, setBases] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  // Filters and pagination
  const [filters, setFilters] = useState({
    base: "",
    assetType: "all",
    status: "all",
    direction: "all",
    startDate: "",
    endDate: "",
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10,
  })

  // Form state
  const [formData, setFormData] = useState({
    assetName: "",
    assetType: "weapon",
    quantity: "",
    unit: "",
    fromBase: "",
    toBase: "",
    transferDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    reason: "",
    notes: "",
    transportMethod: "ground",
    trackingNumber: "",
  })
  const [formLoading, setFormLoading] = useState(false)

  const assetTypes = ["vehicle", "weapon", "ammunition", "equipment", "supplies"]
  const statusOptions = ["pending", "in_transit", "delivered", "cancelled"]
  const transportMethods = ["ground", "air", "sea", "rail"]
  const directionOptions = [
    { value: "all", label: "All Directions" },
    { value: "in", label: "Incoming" },
    { value: "out", label: "Outgoing" },
  ]

  useEffect(() => {
    fetchBases()
    fetchTransfers()
    fetchStats()
  }, [filters, pagination.current])

  const fetchBases = async () => {
    try {
      const response = await axios.get("/transfers/bases/list")
      setBases(response.data)
    } catch (error) {
      console.error("Error fetching bases:", error)
    }
  }

  const fetchTransfers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.base) params.append("base", filters.base)
      if (filters.assetType !== "all") params.append("assetType", filters.assetType)
      if (filters.status !== "all") params.append("status", filters.status)
      if (filters.direction !== "all") params.append("direction", filters.direction)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      params.append("page", pagination.current)
      params.append("limit", pagination.limit)

      const response = await axios.get(`/transfers?${params}`)
      setTransfers(response.data.transfers)
      setPagination(response.data.pagination)
      setError("")
    } catch (error) {
      setError("Failed to fetch transfers")
      console.error("Error fetching transfers:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get("/transfers/stats/summary")
      setStats(response.data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (editingTransfer) {
        // Update existing transfer
        await axios.put(`/transfers/${editingTransfer._id}`, formData)
      } else {
        // Create new transfer
        await axios.post("/transfers", formData)
      }

      setShowForm(false)
      setEditingTransfer(null)
      resetForm()
      fetchTransfers()
      fetchStats()
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save transfer")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (transfer) => {
    setEditingTransfer(transfer)
    setFormData({
      assetName: transfer.assetName,
      assetType: transfer.assetType,
      quantity: transfer.quantity.toString(),
      unit: transfer.unit,
      fromBase: transfer.fromBase,
      toBase: transfer.toBase,
      transferDate: new Date(transfer.transferDate).toISOString().split("T")[0],
      expectedDeliveryDate: transfer.expectedDeliveryDate
        ? new Date(transfer.expectedDeliveryDate).toISOString().split("T")[0]
        : "",
      reason: transfer.reason,
      notes: transfer.notes || "",
      transportMethod: transfer.transportMethod,
      trackingNumber: transfer.trackingNumber || "",
    })
    setShowForm(true)
  }

  const handleStatusUpdate = async (transferId, newStatus) => {
    try {
      await axios.put(`/transfers/${transferId}`, { status: newStatus })
      fetchTransfers()
      fetchStats()
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update status")
    }
  }

  const handleDelete = async (transferId) => {
    if (!window.confirm("Are you sure you want to delete this transfer?")) {
      return
    }

    try {
      await axios.delete(`/transfers/${transferId}`)
      fetchTransfers()
      fetchStats()
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete transfer")
    }
  }

  const resetForm = () => {
    setFormData({
      assetName: "",
      assetType: "weapon",
      quantity: "",
      unit: "",
      fromBase: "",
      toBase: "",
      transferDate: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: "",
      reason: "",
      notes: "",
      transportMethod: "ground",
      trackingNumber: "",
    })
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }

  const getTransferDirection = (transfer) => {
    if (user?.assignedBase) {
      if (transfer.fromBase === user.assignedBase) return "outgoing"
      if (transfer.toBase === user.assignedBase) return "incoming"
    }
    return "neutral"
  }

  // Enhanced refresh function
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchTransfers(), fetchStats()])
    setRefreshing(false)
  }

  return (
    <div className="transfers-container">
      {/* Enhanced Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2>Transfer Management</h2>
            <p>Manage asset transfers between bases in real-time</p>
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
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <span className="btn-icon">➕</span>
              New Transfer
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      {stats && (
        <div className="stats-section">
          <div className="stats-header">
            <h3>Transfer Overview</h3>
            <div className="live-indicator">
              <span className="status-dot"></span>
              <span>Live Data</span>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalTransfers}</div>
                <div className="stat-label">Total Transfers</div>
                <div className="stat-trend">All time records</div>
              </div>
            </div>
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-value">{stats.pendingCount}</div>
                <div className="stat-label">Pending Approval</div>
                <div className="stat-trend">Awaiting processing</div>
              </div>
            </div>
            <div className="stat-card transit">
              <div className="stat-icon">🚚</div>
              <div className="stat-content">
                <div className="stat-value">{stats.inTransitCount}</div>
                <div className="stat-label">In Transit</div>
                <div className="stat-trend">Currently moving</div>
              </div>
            </div>
            <div className="stat-card delivered">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{stats.deliveredCount}</div>
                <div className="stat-label">Delivered</div>
                <div className="stat-trend">Successfully completed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filter & Search</h3>
          <button 
            className="btn btn-outline"
            onClick={() => setFilters({
              base: "",
              assetType: "all",
              status: "all",
              direction: "all",
              startDate: "",
              endDate: "",
            })}
          >
            Clear All
          </button>
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">Base</span>
              <span className="label-icon">🏢</span>
            </label>
            <select
              value={filters.base}
              onChange={(e) => handleFilterChange("base", e.target.value)}
              className="filter-select"
            >
              <option value="">All Bases</option>
              {bases.map((base) => (
                <option key={base} value={base}>
                  {base}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">Asset Type</span>
              <span className="label-icon">🏷️</span>
            </label>
            <select
              value={filters.assetType}
              onChange={(e) => handleFilterChange("assetType", e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              {assetTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">Status</span>
              <span className="label-icon">📊</span>
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">Direction</span>
              <span className="label-icon">↔️</span>
            </label>
            <select
              value={filters.direction}
              onChange={(e) => handleFilterChange("direction", e.target.value)}
              className="filter-select"
            >
              {directionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">Start Date</span>
              <span className="label-icon">📅</span>
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <span className="label-text">End Date</span>
              <span className="label-icon">📅</span>
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="filter-input"
            />
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

      {/* Enhanced Transfers Table */}
      <div className="transfers-section">
        <div className="section-header">
          <h3>Transfer Records</h3>
          <div className="table-info">
            <span className="record-count">{pagination.total} records</span>
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
            <p>Loading transfer data...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <div className="table-wrapper">
                <table className="transfers-table">
                  <thead>
                    <tr>
                      <th>Transfer ID</th>
                      <th>Asset Details</th>
                      <th>Quantity</th>
                      <th>Route</th>
                      <th>Transfer Date</th>
                      <th>Transport</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((transfer, index) => (
                      <tr 
                        key={transfer._id} 
                        className={`transfer-row ${getTransferDirection(transfer)}`}
                        style={{animationDelay: `${index * 0.05}s`}}
                      >
                        <td>
                          <div className="transfer-id">
                            <span className="id-label">TXN</span>
                            <span className="id-value">{transfer.transferId}</span>
                          </div>
                        </td>
                        <td>
                          <div className="asset-info">
                            <div className="asset-name">{transfer.assetName}</div>
                            <div className="asset-type">
                              <span className="type-badge">{transfer.assetType}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="quantity-info">
                            <span className="quantity">{transfer.quantity}</span>
                            <span className="unit">{transfer.unit}</span>
                          </div>
                        </td>
                        <td>
                          <div className="route-info">
                            <div className="route-from">
                              <span className="route-label">From:</span>
                              <span className="base-name">{transfer.fromBase}</span>
                            </div>
                            <div className="route-to">
                              <span className="route-label">To:</span>
                              <span className="base-name">{transfer.toBase}</span>
                            </div>
                            <div className="route-direction">
                              {getTransferDirection(transfer) === "incoming" && (
                                <span className="direction-badge incoming">
                                  <span className="direction-icon">↓</span>
                                  Incoming
                                </span>
                              )}
                              {getTransferDirection(transfer) === "outgoing" && (
                                <span className="direction-badge outgoing">
                                  <span className="direction-icon">↑</span>
                                  Outgoing
                                </span>
                              )}
                              {getTransferDirection(transfer) === "neutral" && (
                                <span className="direction-badge neutral">
                                  <span className="direction-icon">↔</span>
                                  External
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="date-info">
                            <span className="date-value">{formatDate(transfer.transferDate)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="transport-info">
                            <div className="transport-method">
                              <span className="method-icon">
                                {transfer.transportMethod === 'ground' && '🚛'}
                                {transfer.transportMethod === 'air' && '✈️'}
                                {transfer.transportMethod === 'sea' && '🚢'}
                                {transfer.transportMethod === 'rail' && '🚂'}
                              </span>
                              <span className="method-name">{transfer.transportMethod}</span>
                            </div>
                            {transfer.trackingNumber && (
                              <div className="tracking-number">#{transfer.trackingNumber}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-${transfer.status.replace('_', '-')}`}>
                            <span className="status-icon"></span>
                            {transfer.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="action-btn edit" 
                              onClick={() => handleEdit(transfer)}
                              title="Edit Transfer"
                            >
                              ✏️
                            </button>
                            {transfer.status === "pending" && (
                              <button
                                className="action-btn approve"
                                onClick={() => handleStatusUpdate(transfer._id, "in_transit")}
                                title="Approve Transfer"
                              >
                                ✅
                              </button>
                            )}
                            {transfer.status === "in_transit" && (
                              <button
                                className="action-btn deliver"
                                onClick={() => handleStatusUpdate(transfer._id, "delivered")}
                                title="Mark as Delivered"
                              >
                                📦
                              </button>
                            )}
                            {user?.role === "admin" && transfer.status === "pending" && (
                              <button 
                                className="action-btn delete" 
                                onClick={() => handleDelete(transfer._id)}
                                title="Delete Transfer"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
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
                  onClick={() => setPagination((prev) => ({ ...prev, current: prev.current - 1 }))}
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
                  onClick={() => setPagination((prev) => ({ ...prev, current: prev.current + 1 }))}
                >
                  Next
                  <span>›</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Enhanced Transfer Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon">{editingTransfer ? '✏️' : '➕'}</span>
                <h3>{editingTransfer ? "Edit Transfer" : "New Transfer"}</h3>
              </div>
              <button
                className="modal-close"
                onClick={() => {
                  setShowForm(false)
                  setEditingTransfer(null)
                  resetForm()
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="transfer-form">
                <div className="form-section">
                  <h4 className="section-title">Asset Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Asset Type</span>
                        <span className="required">*</span>
                      </label>
                      <select
                        value={formData.assetType}
                        onChange={(e) => handleFormChange("assetType", e.target.value)}
                        className="form-control"
                        required
                      >
                        {assetTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
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
                        onChange={(e) => handleFormChange("assetName", e.target.value)}
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
                        value={formData.quantity}
                        onChange={(e) => handleFormChange("quantity", e.target.value)}
                        className="form-control"
                        required
                        min="1"
                        placeholder="Enter quantity"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Unit</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.unit}
                        onChange={(e) => handleFormChange("unit", e.target.value)}
                        className="form-control"
                        required
                        placeholder="e.g., pieces, rounds, kg"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4 className="section-title">Transfer Route</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">From Base</span>
                        <span className="required">*</span>
                      </label>
                      <select
                        value={formData.fromBase}
                        onChange={(e) => handleFormChange("fromBase", e.target.value)}
                        className="form-control"
                        required
                      >
                        <option value="">Select from base</option>
                        {bases.map((base) => (
                          <option key={base} value={base}>
                            {base}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">To Base</span>
                        <span className="required">*</span>
                      </label>
                      <select
                        value={formData.toBase}
                        onChange={(e) => handleFormChange("toBase", e.target.value)}
                        className="form-control"
                        required
                      >
                        <option value="">Select to base</option>
                        {bases.map((base) => (
                          <option key={base} value={base} disabled={base === formData.fromBase}>
                            {base}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Transfer Date</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.transferDate}
                        onChange={(e) => handleFormChange("transferDate", e.target.value)}
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Expected Delivery Date</span>
                      </label>
                      <input
                        type="date"
                        value={formData.expectedDeliveryDate}
                        onChange={(e) => handleFormChange("expectedDeliveryDate", e.target.value)}
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4 className="section-title">Transport Details</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Transport Method</span>
                        <span className="required">*</span>
                      </label>
                      <select
                        value={formData.transportMethod}
                        onChange={(e) => handleFormChange("transportMethod", e.target.value)}
                        className="form-control"
                        required
                      >
                        {transportMethods.map((method) => (
                          <option key={method} value={method}>
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Tracking Number</span>
                      </label>
                      <input
                        type="text"
                        value={formData.trackingNumber}
                        onChange={(e) => handleFormChange("trackingNumber", e.target.value)}
                        className="form-control"
                        placeholder="Enter tracking number (optional)"
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">
                      <span className="label-text">Reason for Transfer</span>
                      <span className="required">*</span>
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => handleFormChange("reason", e.target.value)}
                      className="form-control"
                      rows="2"
                      required
                      placeholder="Explain the reason for this transfer"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">
                      <span className="label-text">Notes</span>
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleFormChange("notes", e.target.value)}
                      className="form-control"
                      rows="3"
                      placeholder="Additional notes or comments (optional)"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false)
                      setEditingTransfer(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <span className="btn-spinner"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">{editingTransfer ? '💾' : '➕'}</span>
                        {editingTransfer ? "Update Transfer" : "Create Transfer"}
                      </>
                    )}
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

export default Transfers
