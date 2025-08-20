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

  return (
    <div className="transfers-container">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h2>Transfer Management</h2>
            <p>Manage asset transfers between bases</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            New Transfer
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalTransfers}</div>
            <div className="stat-label">Total Transfers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pendingCount}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.inTransitCount}</div>
            <div className="stat-label">In Transit</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.deliveredCount}</div>
            <div className="stat-label">Delivered</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Base</label>
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
            <label className="filter-label">Asset Type</label>
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
            <label className="filter-label">Status</label>
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
            <label className="filter-label">Direction</label>
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
            <label className="filter-label">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Transfers Table */}
      <div className="transfers-section">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading transfers...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="transfers-table">
                <thead>
                  <tr>
                    <th>Transfer ID</th>
                    <th>Asset</th>
                    <th>Quantity</th>
                    <th>Route</th>
                    <th>Transfer Date</th>
                    <th>Transport</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr key={transfer._id} className={`transfer-row ${getTransferDirection(transfer)}`}>
                      <td className="transfer-id">{transfer.transferId}</td>
                      <td>
                        <div className="asset-info">
                          <div className="asset-name">{transfer.assetName}</div>
                          <div className="asset-type">{transfer.assetType}</div>
                        </div>
                      </td>
                      <td>
                        {transfer.quantity} {transfer.unit}
                      </td>
                      <td>
                        <div className="route-info">
                          <div className="route-from">From: {transfer.fromBase}</div>
                          <div className="route-to">To: {transfer.toBase}</div>
                          <div className="route-direction">
                            {getTransferDirection(transfer) === "incoming" && "↓ Incoming"}
                            {getTransferDirection(transfer) === "outgoing" && "↑ Outgoing"}
                            {getTransferDirection(transfer) === "neutral" && "↔ External"}
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(transfer.transferDate)}</td>
                      <td>
                        <div className="transport-info">
                          <div className="transport-method">{transfer.transportMethod}</div>
                          {transfer.trackingNumber && <div className="tracking-number">#{transfer.trackingNumber}</div>}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${transfer.status}`}>
                          {transfer.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-small btn-secondary" onClick={() => handleEdit(transfer)}>
                            Edit
                          </button>
                          {transfer.status === "pending" && (
                            <button
                              className="btn-small btn-primary"
                              onClick={() => handleStatusUpdate(transfer._id, "in_transit")}
                            >
                              Approve
                            </button>
                          )}
                          {transfer.status === "in_transit" && (
                            <button
                              className="btn-small btn-primary"
                              onClick={() => handleStatusUpdate(transfer._id, "delivered")}
                            >
                              Mark Delivered
                            </button>
                          )}
                          {user?.role === "admin" && transfer.status === "pending" && (
                            <button className="btn-small btn-danger" onClick={() => handleDelete(transfer._id)}>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-secondary"
                  disabled={pagination.current === 1}
                  onClick={() => setPagination((prev) => ({ ...prev, current: prev.current - 1 }))}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.current} of {pagination.pages} ({pagination.total} total)
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={pagination.current === pagination.pages}
                  onClick={() => setPagination((prev) => ({ ...prev, current: prev.current + 1 }))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transfer Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTransfer ? "Edit Transfer" : "New Transfer"}</h3>
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
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Asset Type</label>
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
                    <label className="form-label">Asset Name</label>
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
                    <label className="form-label">Quantity</label>
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
                    <label className="form-label">Unit</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => handleFormChange("unit", e.target.value)}
                      className="form-control"
                      required
                      placeholder="e.g., pieces, rounds, kg"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">From Base</label>
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
                    <label className="form-label">To Base</label>
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
                    <label className="form-label">Transfer Date</label>
                    <input
                      type="date"
                      value={formData.transferDate}
                      onChange={(e) => handleFormChange("transferDate", e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Expected Delivery Date</label>
                    <input
                      type="date"
                      value={formData.expectedDeliveryDate}
                      onChange={(e) => handleFormChange("expectedDeliveryDate", e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Transport Method</label>
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
                    <label className="form-label">Tracking Number (Optional)</label>
                    <input
                      type="text"
                      value={formData.trackingNumber}
                      onChange={(e) => handleFormChange("trackingNumber", e.target.value)}
                      className="form-control"
                      placeholder="Enter tracking number"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Transfer</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => handleFormChange("reason", e.target.value)}
                    className="form-control"
                    rows="2"
                    required
                    placeholder="Explain the reason for this transfer"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFormChange("notes", e.target.value)}
                    className="form-control"
                    rows="3"
                    placeholder="Additional notes or comments"
                  />
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
                    {formLoading ? "Saving..." : editingTransfer ? "Update Transfer" : "Create Transfer"}
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
