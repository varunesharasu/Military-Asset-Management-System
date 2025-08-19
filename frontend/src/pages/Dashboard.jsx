"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"

const Dashboard = () => {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState({
    openingBalance: 0,
    closingBalance: 0,
    netMovement: 0,
    assignedAssets: 0,
    expendedAssets: 0,
    netMovementBreakdown: {
      purchases: 0,
      transfersIn: 0,
      transfersOut: 0,
      netMovement: 0,
    },
  })
  const [chartData, setChartData] = useState({
    dailyPurchases: [],
    dailyTransfers: [],
    equipmentDistribution: [],
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showNetMovementModal, setShowNetMovementModal] = useState(false)
  const [filters, setFilters] = useState({
    baseId: "",
    equipmentType: "",
    startDate: "",
    endDate: "",
    period: "30",
  })
  const [bases, setBases] = useState([])
  const [equipmentTypes] = useState(["Vehicle", "Weapon", "Ammunition"])

  useEffect(() => {
    fetchBases()
    fetchDashboardData()
  }, [filters])

  const fetchBases = async () => {
    try {
      const response = await axios.get("/api/bases")
      setBases(response.data.bases)
    } catch (error) {
      console.error("Error fetching bases:", error)
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [metricsRes, chartsRes, activitiesRes] = await Promise.all([
        axios.get("/api/dashboard/metrics", { params: filters }),
        axios.get("/api/dashboard/charts", { params: filters }),
        axios.get("/api/dashboard/recent-activities", { params: { limit: 10 } }),
      ])

      setMetrics(metricsRes.data.metrics)
      setChartData(chartsRes.data)
      setRecentActivities(activitiesRes.data.activities)
      setError("")
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      baseId: "",
      equipmentType: "",
      startDate: "",
      endDate: "",
      period: "30",
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num)
  }

  // Chart colors
  const COLORS = ["#2c5530", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b"]

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

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
            <label>Chart Period (Days)</label>
            <select name="period" value={filters.period} onChange={handleFilterChange} className="form-select">
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
            </select>
          </div>

          <div className="filter-group">
            <button onClick={clearFilters} className="btn btn-outline" style={{ marginTop: "25px" }}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="dashboard-grid">
        <div className="metric-card">
          <div className="metric-value">{formatNumber(metrics.openingBalance)}</div>
          <div className="metric-label">Opening Balance</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(metrics.closingBalance)}</div>
          <div className="metric-label">Closing Balance</div>
        </div>
        <div className="metric-card" style={{ cursor: "pointer" }} onClick={() => setShowNetMovementModal(true)}>
          <div className="metric-value">{formatNumber(metrics.netMovement)}</div>
          <div className="metric-label">Net Movement (Click for details)</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(metrics.assignedAssets)}</div>
          <div className="metric-label">Assigned Assets</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatNumber(metrics.expendedAssets)}</div>
          <div className="metric-label">Expended Assets</div>
        </div>
      </div>

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Daily Purchases Chart */}
        <div className="chart-container">
          <h3 className="chart-title">Daily Purchases</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.dailyPurchases}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill="#2c5530" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Equipment Distribution Chart */}
        <div className="chart-container">
          <h3 className="chart-title">Equipment Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.equipmentDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="quantity"
              >
                {chartData.equipmentDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Activities</h3>
        </div>
        {recentActivities.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>User</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((activity) => (
                  <tr key={`${activity.type}-${activity.id}`}>
                    <td>{formatDate(activity.date)}</td>
                    <td>
                      <span className={`badge badge-${activity.type}`}>
                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                      </span>
                    </td>
                    <td>{activity.description}</td>
                    <td>{activity.user}</td>
                    <td>{formatNumber(activity.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No recent activities found.</p>
        )}
      </div>

      {/* Net Movement Modal */}
      {showNetMovementModal && (
        <div className="modal-overlay" onClick={() => setShowNetMovementModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Net Movement Breakdown</h3>
              <button className="modal-close" onClick={() => setShowNetMovementModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gap: "15px" }}>
                <div className="flex-between">
                  <span>Purchases:</span>
                  <span className="font-weight-bold">+{formatNumber(metrics.netMovementBreakdown.purchases)}</span>
                </div>
                <div className="flex-between">
                  <span>Transfers In:</span>
                  <span className="font-weight-bold">+{formatNumber(metrics.netMovementBreakdown.transfersIn)}</span>
                </div>
                <div className="flex-between">
                  <span>Transfers Out:</span>
                  <span className="font-weight-bold">-{formatNumber(metrics.netMovementBreakdown.transfersOut)}</span>
                </div>
                <hr />
                <div className="flex-between">
                  <span>
                    <strong>Net Movement:</strong>
                  </span>
                  <span
                    className="font-weight-bold"
                    style={{ color: metrics.netMovementBreakdown.netMovement >= 0 ? "#4caf50" : "#f44336" }}
                  >
                    {metrics.netMovementBreakdown.netMovement >= 0 ? "+" : ""}
                    {formatNumber(metrics.netMovementBreakdown.netMovement)}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowNetMovementModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
