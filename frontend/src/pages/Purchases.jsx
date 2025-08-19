"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"

const Purchases = () => {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState([])
  const [bases, setBases] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
  })
  const [summary, setSummary] = useState({
    totalQuantity: 0,
    totalPurchases: 0,
    avgQuantity: 0,
  })

  const [filters, setFilters] = useState({
    baseId: "",
    equipmentType: "",
    startDate: "",
    endDate: "",
    page: 1,
  })

  const [formData, setFormData] = useState({
    baseId: user?.baseId?._id || "",
    equipmentId: "",
    quantity: "",
    date: new Date().toISOString().split("T")[0],
  })

  const equipmentTypes = ["Vehicle", "Weapon", "Ammunition"]

  useEffect(() => {
    fetchBases()
    fetchEquipment()
  }, [])

  useEffect(() => {
    fetchPurchases()
  }, [filters])

  const fetchBases = async () => {
    try {
      const response = await axios.get("/api/bases")
      setBases(response.data.bases)
    } catch (error) {
      console.error("Error fetching bases:", error)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await axios.get("/api/equipment")
      setEquipment(response.data.equipment)
    } catch (error) {
      console.error("Error fetching equipment:", error)
    }
  }

  const fetchPurchases = async () => {
    setLoading(true)
    try {
      const response = await axios.get("/api/purchases", { params: filters })
      setPurchases(response.data.purchases)
      setPagination(response.data.pagination)
      setSummary(response.data.summary)
      setError("")
    } catch (error) {
      console.error("Error fetching purchases:", error)
      setError("Failed to load purchases")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to first page when filtering
    }))
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      if (editingPurchase) {
        await axios.put(`/api/purchases/${editingPurchase._id}`, formData)
        setSuccess("Purchase updated successfully")
      } else {
        await axios.post("/api/purchases", formData)
        setSuccess("Purchase created successfully")
      }

      setShowModal(false)
      setEditingPurchase(null)
      resetForm()
      fetchPurchases()
    } catch (error) {
      console.error("Error saving purchase:", error)
      setError(error.response?.data?.message || "Failed to save purchase")
    }
  }

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase)
    setFormData({
      baseId: purchase.baseId._id,
      equipmentId: purchase.equipmentId._id,
      quantity: purchase.quantity,
      date: new Date(purchase.date).toISOString().split("T")[0],
    })
    setShowModal(true)
  }

  const handleDelete = async (purchaseId) => {
    if (!window.confirm("Are you sure you want to delete this purchase?")) {
      return
    }

    try {
      await axios.delete(`/api/purchases/${purchaseId}`)
      setSuccess("Purchase deleted successfully")
      fetchPurchases()
    } catch (error) {
      console.error("Error deleting purchase:", error)
      setError(error.response?.data?.message || "Failed to delete purchase")
    }
  }

  const resetForm = () => {
    setFormData({
      baseId: user?.baseId?._id || "",
      equipmentId: "",
      quantity: "",
      date: new Date().toISOString().split("T")[0],
    })
  }

  const clearFilters = () => {
    setFilters({
      baseId: "",
      equipmentType: "",
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
    return new Date(dateString).toLocaleDateString()
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num)
  }

  if (loading && purchases.length === 0) {
    return <div className="loading">Loading purchases...</div>
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      {success && <div className="alert alert-success">{success}</div>}

      {/* Summary Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(summary.totalQuantity)}</div>
          <div className="metric-label">Total Quantity</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(summary.totalPurchases)}</div>
          <div className="metric-label">Total Purchases</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(Math.round(summary.avgQuantity || 0))}</div>
          <div className="metric-label">Average Quantity</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filters-grid">
          {user.role === "Admin" && (
            <div className="filter-group">
              <label>Base</label>
              <select name="baseId" value={filters.baseId} onChange={handleFilterChange} className="form-select">
                <option value="">All Bases</option>
                {bases.map((base) => (
                  <option key={base._id} value={base._id}>
                    {base.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label>Equipment Type</label>
            <select
              name="equipmentType"
              value={filters.equipmentType}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All Types</option>
              {equipmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
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

      {/* Actions */}
      <div className="flex-between mb-20">
        <h2>Purchase Records</h2>
        <button
          onClick={() => {
            setEditingPurchase(null)
            resetForm()
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          Add Purchase
        </button>
      </div>

      {/* Purchases Table */}
      <div className="card">
        {purchases.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Base</th>
                    <th>Equipment</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase._id}>
                      <td>{formatDate(purchase.date)}</td>
                      <td>{purchase.baseId.name}</td>
                      <td>{purchase.equipmentId.name}</td>
                      <td>
                        <span className={`badge badge-${purchase.equipmentId.type.toLowerCase()}`}>
                          {purchase.equipmentId.type}
                        </span>
                      </td>
                      <td>{formatNumber(purchase.quantity)}</td>
                      <td>{purchase.equipmentId.unit}</td>
                      <td>{purchase.createdBy.username}</td>
                      <td>
                        <div className="flex gap-10">
                          <button
                            onClick={() => handleEdit(purchase)}
                            className="btn btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                          >
                            Edit
                          </button>
                          {user.role === "Admin" && (
                            <button
                              onClick={() => handleDelete(purchase._id)}
                              className="btn btn-danger"
                              style={{ padding: "4px 8px", fontSize: "12px" }}
                            >
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
            <p>No purchases found.</p>
            <button
              onClick={() => {
                setEditingPurchase(null)
                resetForm()
                setShowModal(true)
              }}
              className="btn btn-primary mt-20"
            >
              Create First Purchase
            </button>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingPurchase ? "Edit Purchase" : "Add New Purchase"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Base</label>
                <select
                  name="baseId"
                  value={formData.baseId}
                  onChange={handleFormChange}
                  className="form-select"
                  required
                  disabled={user.role === "LogisticsOfficer"}
                >
                  <option value="">Select Base</option>
                  {bases.map((base) => (
                    <option key={base._id} value={base._id}>
                      {base.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Equipment</label>
                <select
                  name="equipmentId"
                  value={formData.equipmentId}
                  onChange={handleFormChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Equipment</option>
                  {equipment.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} ({item.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  className="form-input"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="Enter quantity"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPurchase ? "Update Purchase" : "Create Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Purchases
