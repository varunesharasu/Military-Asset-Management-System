"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"

const Assignments = () => {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [bases, setBases] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
  })
  const [summary, setSummary] = useState({
    Assigned: { totalQuantity: 0, count: 0 },
    Expended: { totalQuantity: 0, count: 0 },
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
    baseId: user?.baseId?._id || "",
    equipmentId: "",
    personnel: "",
    quantity: "",
    status: "Assigned",
  })

  const equipmentTypes = ["Vehicle", "Weapon", "Ammunition"]

  useEffect(() => {
    fetchBases()
    fetchEquipment()
  }, [])

  useEffect(() => {
    fetchAssignments()
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

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const response = await axios.get("/api/assignments", { params: filters })
      setAssignments(response.data.assignments)
      setPagination(response.data.pagination)
      setSummary(response.data.summary)
      setError("")
    } catch (error) {
      console.error("Error fetching assignments:", error)
      setError("Failed to load assignments")
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
      await axios.post("/api/assignments", formData)
      setSuccess("Assignment created successfully")
      setShowModal(false)
      resetForm()
      fetchAssignments()
    } catch (error) {
      console.error("Error saving assignment:", error)
      setError(error.response?.data?.message || "Failed to save assignment")
    }
  }

  const handleStatusUpdate = async (assignmentId, newStatus) => {
    try {
      await axios.put(`/api/assignments/${assignmentId}/status`, { status: newStatus })
      setSuccess(`Assignment marked as ${newStatus.toLowerCase()}`)
      fetchAssignments()
    } catch (error) {
      console.error("Error updating assignment status:", error)
      setError(error.response?.data?.message || "Failed to update assignment status")
    }
  }

  const resetForm = () => {
    setFormData({
      baseId: user?.baseId?._id || "",
      equipmentId: "",
      personnel: "",
      quantity: "",
      status: "Assigned",
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

  if (loading && assignments.length === 0) {
    return <div className="loading">Loading assignments...</div>
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      {success && <div className="alert alert-success">{success}</div>}

      {/* Summary Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(summary.Assigned.count)}</div>
          <div className="metric-label">Active Assignments</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(summary.Expended.count)}</div>
          <div className="metric-label">Expended Assets</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(summary.Assigned.totalQuantity)}</div>
          <div className="metric-label">Total Assigned Quantity</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(summary.Expended.totalQuantity)}</div>
          <div className="metric-label">Total Expended Quantity</div>
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
              <option value="Assigned">Assigned</option>
              <option value="Expended">Expended</option>
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
        <h2>Assignment Records</h2>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          Create Assignment
        </button>
      </div>

      {/* Assignments Table */}
      <div className="card">
        {assignments.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Base</th>
                    <th>Equipment</th>
                    <th>Personnel</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Expended Date</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment._id}>
                      <td>{formatDate(assignment.date)}</td>
                      <td>{assignment.baseId.name}</td>
                      <td>
                        <div>
                          <div>{assignment.equipmentId.name}</div>
                          <small className={`badge badge-${assignment.equipmentId.type.toLowerCase()}`}>
                            {assignment.equipmentId.type}
                          </small>
                        </div>
                      </td>
                      <td>{assignment.personnel}</td>
                      <td>
                        {formatNumber(assignment.quantity)} {assignment.equipmentId.unit}
                      </td>
                      <td>
                        <span
                          className={`badge ${assignment.status === "Assigned" ? "badge-success" : "badge-danger"}`}
                        >
                          {assignment.status}
                        </span>
                      </td>
                      <td>{assignment.expendedDate ? formatDate(assignment.expendedDate) : "-"}</td>
                      <td>{assignment.createdBy.username}</td>
                      <td>
                        {assignment.status === "Assigned" && (
                          <button
                            onClick={() => handleStatusUpdate(assignment._id, "Expended")}
                            className="btn btn-danger"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                          >
                            Mark Expended
                          </button>
                        )}
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
            <p>No assignments found.</p>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="btn btn-primary mt-20"
            >
              Create First Assignment
            </button>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Assignment</h3>
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
                  disabled={user.role === "BaseCommander"}
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
                <label className="form-label">Personnel</label>
                <input
                  type="text"
                  name="personnel"
                  value={formData.personnel}
                  onChange={handleFormChange}
                  className="form-input"
                  required
                  placeholder="Enter personnel name"
                />
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
                  placeholder="Enter quantity to assign"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="form-select"
                  required
                >
                  <option value="Assigned">Assigned</option>
                  <option value="Expended">Expended</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Assignment
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
