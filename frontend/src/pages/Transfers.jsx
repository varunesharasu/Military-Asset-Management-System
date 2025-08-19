"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"

const Transfers = () => {
  const { user } = useAuth()
  const [transfers, setTransfers] = useState([])
  const [bases, setBases] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
  })
  const [summary, setSummary] = useState({
    Pending: { totalQuantity: 0, count: 0 },
    "In Transit": { totalQuantity: 0, count: 0 },
    Completed: { totalQuantity: 0, count: 0 },
    Cancelled: { totalQuantity: 0, count: 0 },
  })

  const [filters, setFilters] = useState({
    baseId: "",
    equipmentType: "",
    status: "",
    startDate: "",
    endDate: "",
    page: 1,
  })

  const [formData, setFormData] = useState({
    fromBaseId: user?.baseId?._id || "",
    toBaseId: "",
    equipmentId: "",
    quantity: "",
    date: new Date().toISOString().split("T")[0],
  })

  const equipmentTypes = ["Vehicle", "Weapon", "Ammunition"]
  const transferStatuses = ["Pending", "In Transit", "Completed", "Cancelled"]

  useEffect(() => {
    fetchBases()
    fetchEquipment()
  }, [])

  useEffect(() => {
    fetchTransfers()
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

  const fetchTransfers = async () => {
    setLoading(true)
    try {
      const response = await axios.get("/api/transfers", { params: filters })
      setTransfers(response.data.transfers)
      setPagination(response.data.pagination)
      setSummary(response.data.summary)
      setError("")
    } catch (error) {
      console.error("Error fetching transfers:", error)
      setError("Failed to load transfers")
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
      if (editingTransfer) {
        await axios.put(`/api/transfers/${editingTransfer._id}`, formData)
        setSuccess("Transfer updated successfully")
      } else {
        await axios.post("/api/transfers", formData)
        setSuccess("Transfer created successfully")
      }

      setShowModal(false)
      setEditingTransfer(null)
      resetForm()
      fetchTransfers()
    } catch (error) {
      console.error("Error saving transfer:", error)
      setError(error.response?.data?.message || "Failed to save transfer")
    }
  }

  const handleStatusUpdate = async (transferId, newStatus) => {
    try {
      await axios.put(`/api/transfers/${transferId}/status`, { status: newStatus })
      setSuccess(`Transfer status updated to ${newStatus}`)
      fetchTransfers()
    } catch (error) {
      console.error("Error updating transfer status:", error)
      setError(error.response?.data?.message || "Failed to update transfer status")
    }
  }

  const handleEdit = (transfer) => {
    setEditingTransfer(transfer)
    setFormData({
      fromBaseId: transfer.fromBaseId._id,
      toBaseId: transfer.toBaseId._id,
      equipmentId: transfer.equipmentId._id,
      quantity: transfer.quantity,
      date: new Date(transfer.date).toISOString().split("T")[0],
    })
    setShowModal(true)
  }

  const handleDelete = async (transferId) => {
    if (!window.confirm("Are you sure you want to delete this transfer?")) {
      return
    }

    try {
      await axios.delete(`/api/transfers/${transferId}`)
      setSuccess("Transfer deleted successfully")
      fetchTransfers()
    } catch (error) {
      console.error("Error deleting transfer:", error)
      setError(error.response?.data?.message || "Failed to delete transfer")
    }
  }

  const resetForm = () => {
    setFormData({
      fromBaseId: user?.baseId?._id || "",
      toBaseId: "",
      equipmentId: "",
      quantity: "",
      date: new Date().toISOString().split("T")[0],
    })
  }

  const clearFilters = () => {
    setFilters({
      baseId: "",
      equipmentType: "",
      status: "",
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "badge-warning"
      case "In Transit":
        return "badge-info"
      case "Completed":
        return "badge-success"
      case "Cancelled":
        return "badge-danger"
      default:
        return "badge-secondary"
    }
  }

  if (loading && transfers.length === 0) {
    return <div className="loading">Loading transfers...</div>
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      {success && <div className="alert alert-success">{success}</div>}

      {/* Summary Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(summary.Pending.count)}</div>
          <div className="metric-label">Pending</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(summary["In Transit"].count)}</div>
          <div className="metric-label">In Transit</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(summary.Completed.count)}</div>
          <div className="metric-label">Completed</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(summary.Cancelled.count)}</div>
          <div className="metric-label">Cancelled</div>
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
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="form-select">
              <option value="">All Statuses</option>
              {transferStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
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
        <h2>Transfer Records</h2>
        <button
          onClick={() => {
            setEditingTransfer(null)
            resetForm()
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          Create Transfer
        </button>
      </div>

      {/* Transfers Table */}
      <div className="card">
        {transfers.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>From Base</th>
                    <th>To Base</th>
                    <th>Equipment</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr key={transfer._id}>
                      <td>{formatDate(transfer.date)}</td>
                      <td>{transfer.fromBaseId.name}</td>
                      <td>{transfer.toBaseId.name}</td>
                      <td>
                        <div>
                          <div>{transfer.equipmentId.name}</div>
                          <small className={`badge badge-${transfer.equipmentId.type.toLowerCase()}`}>
                            {transfer.equipmentId.type}
                          </small>
                        </div>
                      </td>
                      <td>
                        {formatNumber(transfer.quantity)} {transfer.equipmentId.unit}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(transfer.status)}`}>{transfer.status}</span>
                      </td>
                      <td>{transfer.createdBy.username}</td>
                      <td>
                        <div className="flex gap-10" style={{ flexWrap: "wrap" }}>
                          {transfer.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleEdit(transfer)}
                                className="btn btn-secondary"
                                style={{ padding: "4px 8px", fontSize: "12px" }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(transfer._id, "In Transit")}
                                className="btn btn-primary"
                                style={{ padding: "4px 8px", fontSize: "12px" }}
                              >
                                Start
                              </button>
                            </>
                          )}
                          {transfer.status === "In Transit" && (
                            <button
                              onClick={() => handleStatusUpdate(transfer._id, "Completed")}
                              className="btn btn-primary"
                              style={{ padding: "4px 8px", fontSize: "12px" }}
                            >
                              Complete
                            </button>
                          )}
                          {(transfer.status === "Pending" || transfer.status === "In Transit") && (
                            <button
                              onClick={() => handleStatusUpdate(transfer._id, "Cancelled")}
                              className="btn btn-danger"
                              style={{ padding: "4px 8px", fontSize: "12px" }}
                            >
                              Cancel
                            </button>
                          )}
                          {user.role === "Admin" && transfer.status === "Pending" && (
                            <button
                              onClick={() => handleDelete(transfer._id)}
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
            <p>No transfers found.</p>
            <button
              onClick={() => {
                setEditingTransfer(null)
                resetForm()
                setShowModal(true)
              }}
              className="btn btn-primary mt-20"
            >
              Create First Transfer
            </button>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingTransfer ? "Edit Transfer" : "Create New Transfer"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">From Base</label>
                <select
                  name="fromBaseId"
                  value={formData.fromBaseId}
                  onChange={handleFormChange}
                  className="form-select"
                  required
                  disabled={user.role === "LogisticsOfficer"}
                >
                  <option value="">Select Source Base</option>
                  {bases.map((base) => (
                    <option key={base._id} value={base._id}>
                      {base.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">To Base</label>
                <select
                  name="toBaseId"
                  value={formData.toBaseId}
                  onChange={handleFormChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Destination Base</option>
                  {bases
                    .filter((base) => base._id !== formData.fromBaseId)
                    .map((base) => (
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
                  placeholder="Enter quantity to transfer"
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
                  {editingTransfer ? "Update Transfer" : "Create Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transfers
