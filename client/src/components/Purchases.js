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
  const [refreshing, setRefreshing] = useState(false)

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

  // Enhanced refresh function
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchPurchases(), fetchStats()])
    setRefreshing(false)
  }

  return (
    <div className="purchases-container">
      {/* Enhanced Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2>Purchase Management</h2>
            <p>Record and track asset purchases in real-time</p>
          </div>
          <div className="header-actions">
            <button
              className={`btn btn-refresh ${refreshing ? "refreshing" : ""}`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <span className="btn-icon">🔄</span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <span className="btn-icon">➕</span>
              New Purchase
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      {stats && (
        <div className="stats-section">
          <div className="stats-header">
            <h3>Purchase Overview</h3>
            <div className="live-indicator">
              <span className="status-dot"></span>
              <span>Live Data</span>
            </div>
          </div>
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalPurchases}</div>
                <div className="stat-label">Total Purchases</div>
                <div className="stat-trend">+12% from last month</div>
              </div>
            </div>
            <div className="stat-card value">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(stats.totalValue)}</div>
                <div className="stat-label">Total Value</div>
                <div className="stat-trend">+8% from last month</div>
              </div>
            </div>
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-value">{stats.pendingCount}</div>
                <div className="stat-label">Pending Approval</div>
                <div className="stat-trend">Requires attention</div>
              </div>
            </div>
            <div className="stat-card delivered">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{stats.deliveredCount}</div>
                <div className="stat-label">Delivered</div>
                <div className="stat-trend">On schedule</div>
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
            onClick={() =>
              setFilters({
                base: "",
                assetType: "all",
                status: "all",
                startDate: "",
                endDate: "",
              })
            }
          >
            Clear All
          </button>
        </div>
        <div className="filters-grid">
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
              <span className="label-icon">📋</span>
            </label>
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
          <button className="alert-close" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {/* Enhanced Purchases Table */}
      <div className="purchases-section">
        <div className="section-header">
          <h3>Purchase Records</h3>
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
            <p>Loading purchase data...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <div className="table-wrapper">
                <table className="purchases-table">
                  <thead>
                    <tr>
                      <th>Purchase ID</th>
                      <th>Asset Details</th>
                      <th>Quantity</th>
                      <th>Pricing</th>
                      <th>Vendor</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase, index) => (
                      <tr key={purchase._id} style={{ animationDelay: `${index * 0.05}s` }}>
                        <td>
                          <div className="purchase-id">
                            <span className="id-label">ID</span>
                            <span className="id-value">{purchase.purchaseId}</span>
                          </div>
                        </td>
                        <td>
                          <div className="asset-info">
                            <div className="asset-name">{purchase.assetName}</div>
                            <div className="asset-type">
                              <span className="type-badge">{purchase.assetType}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="quantity-info">
                            <span className="quantity">{purchase.quantity}</span>
                            <span className="unit">{purchase.unit}</span>
                          </div>
                        </td>
                        <td>
                          <div className="pricing-info">
                            <div className="unit-price">{formatCurrency(purchase.unitPrice)}/unit</div>
                            <div className="total-amount">{formatCurrency(purchase.totalAmount)}</div>
                          </div>
                        </td>
                        <td>
                          <div className="vendor-info">
                            <span className="vendor-name">{purchase.vendor}</span>
                          </div>
                        </td>
                        <td>
                          <div className="date-info">
                            <span className="date-value">{formatDate(purchase.purchaseDate)}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-${purchase.status}`}>
                            <span className="status-icon"></span>
                            {purchase.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit"
                              onClick={() => handleEdit(purchase)}
                              title="Edit Purchase"
                            >
                              ✏️
                            </button>
                            {purchase.status === "pending" && (
                              <button
                                className="action-btn approve"
                                onClick={() => handleStatusUpdate(purchase._id, "approved")}
                                title="Approve Purchase"
                              >
                                ✅
                              </button>
                            )}
                            {purchase.status === "approved" && (
                              <button
                                className="action-btn deliver"
                                onClick={() => handleStatusUpdate(purchase._id, "delivered")}
                                title="Mark as Delivered"
                              >
                                🚚
                              </button>
                            )}
                            {user?.role === "admin" && purchase.status === "pending" && (
                              <button
                                className="action-btn delete"
                                onClick={() => handleDelete(purchase._id)}
                                title="Delete Purchase"
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
                  <span className="total-records">({pagination.total} total records)</span>
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

      {/* Enhanced Purchase Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon">{editingPurchase ? "✏️" : "➕"}</span>
                <h3>{editingPurchase ? "Edit Purchase" : "New Purchase"}</h3>
              </div>
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
                  </div>
                </div>

                <div className="form-section">
                  <h4 className="section-title">Quantity & Pricing</h4>
                  <div className="form-grid">
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

                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Unit Price ($)</span>
                        <span className="required">*</span>
                      </label>
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
                      <label className="form-label">
                        <span className="label-text">Vendor</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.vendor}
                        onChange={(e) => handleFormChange("vendor", e.target.value)}
                        className="form-control"
                        required
                        placeholder="Enter vendor name"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4 className="section-title">Additional Details</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Purchase Date</span>
                        <span className="required">*</span>
                      </label>
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
                        <label className="form-label">
                          <span className="label-text">Destination Base</span>
                          <span className="required">*</span>
                        </label>
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

                {formData.quantity && formData.unitPrice && (
                  <div className="total-preview">
                    <div className="preview-content">
                      <span className="preview-label">Total Amount</span>
                      <span className="preview-value">
                        {formatCurrency(
                          Number.parseFloat(formData.quantity) * Number.parseFloat(formData.unitPrice)
                        )}
                      </span>
                    </div>
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
                    {formLoading ? (
                      <>
                        <span className="btn-spinner"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">{editingPurchase ? "💾" : "➕"}</span>
                        {editingPurchase ? "Update Purchase" : "Create Purchase"}
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

export default Purchases
