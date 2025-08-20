"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import axios from "axios"
import "../styles/Purchases.css"

const Purchases = () => {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState(null)
  const [stats, setStats] = useState(null)

  // Filters and pagination
  const [filters, setFilters] = useState({
    base: "",
    assetType: "all",
    status: "all",
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
    assetType: "weapon",
    assetName: "",
    quantity: "",
    unit: "",
    unitPrice: "",
    vendor: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    destinationBase: "",
    notes: "",
  })
  const [formLoading, setFormLoading] = useState(false)

  const assetTypes = ["vehicle", "weapon", "ammunition", "equipment", "supplies"]
  const statusOptions = ["pending", "approved", "delivered", "cancelled"]

  useEffect(() => {
    fetchPurchases()
    fetchStats()
  }, [filters, pagination.current])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.base) params.append("base", filters.base)
      if (filters.assetType !== "all") params.append("assetType", filters.assetType)
      if (filters.status !== "all") params.append("status", filters.status)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      params.append("page", pagination.current)
      params.append("limit", pagination.limit)

      const response = await axios.get(`/purchases?${params}`)
      setPurchases(response.data.purchases)
      setPagination(response.data.pagination)
      setError("")
    } catch (error) {
      setError("Failed to fetch purchases")
      console.error("Error fetching purchases:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get("/purchases/stats/summary")
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
      if (editingPurchase) {
        // Update existing purchase
        await axios.put(`/purchases/${editingPurchase._id}`, formData)
      } else {
        // Create new purchase
        await axios.post("/purchases", formData)
      }

      setShowForm(false)
      setEditingPurchase(null)
      resetForm()
      fetchPurchases()
      fetchStats()
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save purchase")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase)
    setFormData({
      assetType: purchase.assetType,
      assetName: purchase.assetName,
      quantity: purchase.quantity.toString(),
      unit: purchase.unit,
      unitPrice: purchase.unitPrice.toString(),
      vendor: purchase.vendor,
      purchaseDate: new Date(purchase.purchaseDate).toISOString().split("T")[0],
      destinationBase: purchase.destinationBase,
      notes: purchase.notes || "",
    })
    setShowForm(true)
  }

  const handleStatusUpdate = async (purchaseId, newStatus) => {
    try {
      await axios.put(`/purchases/${purchaseId}`, { status: newStatus })
      fetchPurchases()
      fetchStats()
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update status")
    }
  }

  const handleDelete = async (purchaseId) => {
    if (!window.confirm("Are you sure you want to delete this purchase?")) {
      return
    }

    try {
      await axios.delete(`/purchases/${purchaseId}`)
      fetchPurchases()
      fetchStats()
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete purchase")
    }
  }

  const resetForm = () => {
    setFormData({
      assetType: "weapon",
      assetName: "",
      quantity: "",
      unit: "",
      unitPrice: "",
      vendor: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      destinationBase: "",
      notes: "",
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="purchases-container">
      <div className="page-header">
        <h2>Purchase Management</h2>
        <p>Record and track asset purchases</p>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          New Purchase
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalPurchases}</div>
            <div className="stat-label">Total Purchases</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(stats.totalValue)}</div>
            <div className="stat-label">Total Value</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pendingCount}</div>
            <div className="stat-label">Pending</div>
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
                  {status.charAt(0).toUpperCase() + status.slice(1)}
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

      {/* Purchases Table */}
      <div className="purchases-section">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading purchases...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="purchases-table">
                <thead>
                  <tr>
                    <th>Purchase ID</th>
                    <th>Asset</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Vendor</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase._id}>
                      <td className="purchase-id">{purchase.purchaseId}</td>
                      <td>
                        <div className="asset-info">
                          <div className="asset-name">{purchase.assetName}</div>
                          <div className="asset-type">{purchase.assetType}</div>
                        </div>
                      </td>
                      <td>
                        {purchase.quantity} {purchase.unit}
                      </td>
                      <td>{formatCurrency(purchase.unitPrice)}</td>
                      <td className="total-amount">{formatCurrency(purchase.totalAmount)}</td>
                      <td>{purchase.vendor}</td>
                      <td>{formatDate(purchase.purchaseDate)}</td>
                      <td>
                        <span className={`status-badge status-${purchase.status}`}>{purchase.status}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-small btn-secondary" onClick={() => handleEdit(purchase)}>
                            Edit
                          </button>
                          {purchase.status === "pending" && (
                            <button
                              className="btn-small btn-primary"
                              onClick={() => handleStatusUpdate(purchase._id, "approved")}
                            >
                              Approve
                            </button>
                          )}
                          {purchase.status === "approved" && (
                            <button
                              className="btn-small btn-primary"
                              onClick={() => handleStatusUpdate(purchase._id, "delivered")}
                            >
                              Mark Delivered
                            </button>
                          )}
                          {user?.role === "admin" && purchase.status === "pending" && (
                            <button className="btn-small btn-danger" onClick={() => handleDelete(purchase._id)}>
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

      {/* Purchase Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPurchase ? "Edit Purchase" : "New Purchase"}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowForm(false)
                  setEditingPurchase(null)
                  resetForm()
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="purchase-form">
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
                    <label className="form-label">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={(e) => handleFormChange("unitPrice", e.target.value)}
                      className="form-control"
                      required
                      min="0"
                      placeholder="Enter unit price"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vendor</label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => handleFormChange("vendor", e.target.value)}
                      className="form-control"
                      required
                      placeholder="Enter vendor name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Date</label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => handleFormChange("purchaseDate", e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>

                  {user?.role === "admin" && (
                    <div className="form-group">
                      <label className="form-label">Destination Base</label>
                      <input
                        type="text"
                        value={formData.destinationBase}
                        onChange={(e) => handleFormChange("destinationBase", e.target.value)}
                        className="form-control"
                        required
                        placeholder="Enter destination base"
                      />
                    </div>
                  )}
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

                {formData.quantity && formData.unitPrice && (
                  <div className="total-preview">
                    <strong>
                      Total Amount:{" "}
                      {formatCurrency(Number.parseFloat(formData.quantity) * Number.parseFloat(formData.unitPrice))}
                    </strong>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false)
                      setEditingPurchase(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? "Saving..." : editingPurchase ? "Update Purchase" : "Create Purchase"}
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

export default Purchases
