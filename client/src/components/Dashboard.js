// "use client"

// import { useState, useEffect } from "react"
// import { useAuth } from "../context/AuthContext"
// import axios from "axios"
// import "../styles/Dashboard.css"

// const Dashboard = () => {
//   const { user } = useAuth()
//   const [metrics, setMetrics] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState("")
//   const [filters, setFilters] = useState({
//     base: "",
//     assetType: "all",
//     startDate: "",
//     endDate: "",
//   })
//   const [bases, setBases] = useState([])
//   const [assetTypes, setAssetTypes] = useState([])
//   const [showMovementDetails, setShowMovementDetails] = useState(false)
//   const [movementDetails, setMovementDetails] = useState(null)
//   const [loadingDetails, setLoadingDetails] = useState(false)

//   useEffect(() => {
//     fetchBases()
//     fetchAssetTypes()
//     fetchMetrics()
//   }, [])

//   useEffect(() => {
//     fetchMetrics()
//   }, [filters])

//   const fetchBases = async () => {
//     try {
//       const response = await axios.get("/dashboard/bases")
//       setBases(response.data)
//       if (response.data.length === 1) {
//         setFilters((prev) => ({ ...prev, base: response.data[0] }))
//       }
//     } catch (error) {
//       console.error("Error fetching bases:", error)
//     }
//   }

//   const fetchAssetTypes = async () => {
//     try {
//       const response = await axios.get("/dashboard/asset-types")
//       setAssetTypes(response.data)
//     } catch (error) {
//       console.error("Error fetching asset types:", error)
//     }
//   }

//   const fetchMetrics = async () => {
//     try {
//       setLoading(true)
//       const params = new URLSearchParams()
//       if (filters.base) params.append("base", filters.base)
//       if (filters.assetType !== "all") params.append("assetType", filters.assetType)
//       if (filters.startDate) params.append("startDate", filters.startDate)
//       if (filters.endDate) params.append("endDate", filters.endDate)

//       const response = await axios.get(`/dashboard/metrics?${params}`)
//       setMetrics(response.data)
//       setError("")
//     } catch (error) {
//       setError("Failed to fetch dashboard metrics")
//       console.error("Error fetching metrics:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const fetchMovementDetails = async () => {
//     try {
//       setLoadingDetails(true)
//       const params = new URLSearchParams()
//       if (filters.base) params.append("base", filters.base)
//       if (filters.assetType !== "all") params.append("assetType", filters.assetType)
//       if (filters.startDate) params.append("startDate", filters.startDate)
//       if (filters.endDate) params.append("endDate", filters.endDate)

//       const response = await axios.get(`/dashboard/movement-details?${params}`)
//       setMovementDetails(response.data)
//       setShowMovementDetails(true)
//     } catch (error) {
//       setError("Failed to fetch movement details")
//       console.error("Error fetching movement details:", error)
//     } finally {
//       setLoadingDetails(false)
//     }
//   }

//   const handleFilterChange = (field, value) => {
//     setFilters((prev) => ({ ...prev, [field]: value }))
//   }

//   const formatNumber = (num) => {
//     return new Intl.NumberFormat().format(num || 0)
//   }

//   const formatDate = (date) => {
//     return new Date(date).toLocaleDateString()
//   }

//   if (loading) {
//     return (
//       <div className="loading">
//         <div className="loading-spinner"></div>
//         <p>Loading dashboard...</p>
//       </div>
//     )
//   }

//   return (
//     <div className="dashboard">
//       <div className="dashboard-header">
//         <h2>Asset Dashboard</h2>
//         <p>
//           Welcome back, {user?.rank} {user?.firstName} {user?.lastName}
//         </p>
//       </div>

//       <div className="dashboard-filters">
//         <div className="filter-group">
//           <label className="filter-label">Base</label>
//           <select
//             value={filters.base}
//             onChange={(e) => handleFilterChange("base", e.target.value)}
//             className="filter-select"
//             disabled={bases.length <= 1}
//           >
//             <option value="">All Bases</option>
//             {bases.map((base) => (
//               <option key={base} value={base}>
//                 {base}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="filter-group">
//           <label className="filter-label">Equipment Type</label>
//           <select
//             value={filters.assetType}
//             onChange={(e) => handleFilterChange("assetType", e.target.value)}
//             className="filter-select"
//           >
//             <option value="all">All Types</option>
//             {assetTypes.map((type) => (
//               <option key={type} value={type}>
//                 {type.charAt(0).toUpperCase() + type.slice(1)}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="filter-group">
//           <label className="filter-label">Start Date</label>
//           <input
//             type="date"
//             value={filters.startDate}
//             onChange={(e) => handleFilterChange("startDate", e.target.value)}
//             className="filter-input"
//           />
//         </div>

//         <div className="filter-group">
//           <label className="filter-label">End Date</label>
//           <input
//             type="date"
//             value={filters.endDate}
//             onChange={(e) => handleFilterChange("endDate", e.target.value)}
//             className="filter-input"
//           />
//         </div>

//         <button onClick={fetchMetrics} className="btn btn-primary filter-btn">
//           Apply Filters
//         </button>
//       </div>

//       {error && <div className="alert alert-error">{error}</div>}

//       {metrics && (
//         <>
//           <div className="dashboard-grid">
//             <div className="dashboard-card">
//               <div className="card-header">
//                 <h3>Opening Balance</h3>
//                 <span className="card-icon">📊</span>
//               </div>
//               <div className="card-content">
//                 <div className="metric">
//                   <div className="metric-value">{formatNumber(metrics.openingBalance)}</div>
//                   <div className="metric-label">Total Units</div>
//                 </div>
//               </div>
//             </div>

//             <div className="dashboard-card">
//               <div className="card-header">
//                 <h3>Closing Balance</h3>
//                 <span className="card-icon">📈</span>
//               </div>
//               <div className="card-content">
//                 <div className="metric">
//                   <div className="metric-value">{formatNumber(metrics.closingBalance)}</div>
//                   <div className="metric-label">Current Stock</div>
//                 </div>
//               </div>
//             </div>

//             <div className="dashboard-card clickable" onClick={fetchMovementDetails}>
//               <div className="card-header">
//                 <h3>Net Movement</h3>
//                 <span className="card-icon">🔄</span>
//               </div>
//               <div className="card-content">
//                 <div className="metric">
//                   <div className="metric-value">{formatNumber(metrics.netMovement)}</div>
//                   <div className="metric-label">Click for Details</div>
//                 </div>
//               </div>
//             </div>

//             <div className="dashboard-card">
//               <div className="card-header">
//                 <h3>Assigned Assets</h3>
//                 <span className="card-icon">👥</span>
//               </div>
//               <div className="card-content">
//                 <div className="metric">
//                   <div className="metric-value">{formatNumber(metrics.assigned)}</div>
//                   <div className="metric-label">In Use</div>
//                 </div>
//               </div>
//             </div>

//             <div className="dashboard-card">
//               <div className="card-header">
//                 <h3>Expended Assets</h3>
//                 <span className="card-icon">📉</span>
//               </div>
//               <div className="card-content">
//                 <div className="metric">
//                   <div className="metric-value">{formatNumber(metrics.expended)}</div>
//                   <div className="metric-label">Consumed</div>
//                 </div>
//               </div>
//             </div>

//             <div className="dashboard-card">
//               <div className="card-header">
//                 <h3>Movement Breakdown</h3>
//                 <span className="card-icon">📋</span>
//               </div>
//               <div className="card-content">
//                 <div className="movement-breakdown">
//                   <div className="breakdown-item">
//                     <span className="breakdown-label">Purchases:</span>
//                     <span className="breakdown-value">{formatNumber(metrics.purchases)}</span>
//                   </div>
//                   <div className="breakdown-item">
//                     <span className="breakdown-label">Transfer In:</span>
//                     <span className="breakdown-value">{formatNumber(metrics.transferIn)}</span>
//                   </div>
//                   <div className="breakdown-item">
//                     <span className="breakdown-label">Transfer Out:</span>
//                     <span className="breakdown-value">{formatNumber(metrics.transferOut)}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {Object.keys(metrics.assetsByType).length > 0 && (
//             <div className="dashboard-section">
//               <h3>Assets by Type</h3>
//               <div className="asset-type-grid">
//                 {Object.entries(metrics.assetsByType).map(([type, data]) => (
//                   <div key={type} className="asset-type-card">
//                     <h4>{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
//                     <div className="asset-type-metrics">
//                       <div className="asset-metric">
//                         <span className="metric-label">Opening:</span>
//                         <span className="metric-value">{formatNumber(data.openingBalance)}</span>
//                       </div>
//                       <div className="asset-metric">
//                         <span className="metric-label">Closing:</span>
//                         <span className="metric-value">{formatNumber(data.closingBalance)}</span>
//                       </div>
//                       <div className="asset-metric">
//                         <span className="metric-label">Net Movement:</span>
//                         <span className="metric-value">{formatNumber(data.netMovement)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {metrics.recentActivity.length > 0 && (
//             <div className="dashboard-section">
//               <h3>Recent Activity</h3>
//               <div className="activity-list">
//                 {metrics.recentActivity.map((activity, index) => (
//                   <div key={index} className="activity-item">
//                     <div className="activity-icon">{activity.type === "purchase" ? "🛒" : "🚚"}</div>
//                     <div className="activity-content">
//                       <div className="activity-description">{activity.description}</div>
//                       <div className="activity-meta">
//                         <span className="activity-user">
//                           {activity.user?.rank} {activity.user?.firstName} {activity.user?.lastName}
//                         </span>
//                         <span className="activity-date">{formatDate(activity.date)}</span>
//                         <span className={`activity-status status-${activity.status}`}>{activity.status}</span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </>
//       )}

//       {showMovementDetails && (
//         <div className="modal-overlay" onClick={() => setShowMovementDetails(false)}>
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <h3>Movement Details</h3>
//               <button className="modal-close" onClick={() => setShowMovementDetails(false)}>
//                 ×
//               </button>
//             </div>
//             <div className="modal-body">
//               {loadingDetails ? (
//                 <div className="loading">
//                   <div className="loading-spinner"></div>
//                   <p>Loading details...</p>
//                 </div>
//               ) : (
//                 movementDetails && (
//                   <div className="movement-details">
//                     <div className="detail-section">
//                       <h4>Purchases ({movementDetails.purchases.length})</h4>
//                       <div className="detail-list">
//                         {movementDetails.purchases.map((purchase) => (
//                           <div key={purchase.id} className="detail-item">
//                             <div className="detail-main">
//                               <span className="detail-name">{purchase.assetName}</span>
//                               <span className="detail-quantity">
//                                 {purchase.quantity} {purchase.unit}
//                               </span>
//                             </div>
//                             <div className="detail-meta">
//                               <span className="detail-vendor">{purchase.vendor}</span>
//                               <span className="detail-date">{formatDate(purchase.date)}</span>
//                               <span className={`detail-status status-${purchase.status}`}>{purchase.status}</span>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>

//                     <div className="detail-section">
//                       <h4>Transfers In ({movementDetails.transfersIn.length})</h4>
//                       <div className="detail-list">
//                         {movementDetails.transfersIn.map((transfer) => (
//                           <div key={transfer.id} className="detail-item">
//                             <div className="detail-main">
//                               <span className="detail-name">{transfer.assetName}</span>
//                               <span className="detail-quantity">
//                                 {transfer.quantity} {transfer.unit}
//                               </span>
//                             </div>
//                             <div className="detail-meta">
//                               <span className="detail-from">From: {transfer.fromBase}</span>
//                               <span className="detail-date">{formatDate(transfer.date)}</span>
//                               <span className={`detail-status status-${transfer.status}`}>{transfer.status}</span>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>

//                     <div className="detail-section">
//                       <h4>Transfers Out ({movementDetails.transfersOut.length})</h4>
//                       <div className="detail-list">
//                         {movementDetails.transfersOut.map((transfer) => (
//                           <div key={transfer.id} className="detail-item">
//                             <div className="detail-main">
//                               <span className="detail-name">{transfer.assetName}</span>
//                               <span className="detail-quantity">
//                                 {transfer.quantity} {transfer.unit}
//                               </span>
//                             </div>
//                             <div className="detail-meta">
//                               <span className="detail-to">To: {transfer.toBase}</span>
//                               <span className="detail-date">{formatDate(transfer.date)}</span>
//                               <span className={`detail-status status-${transfer.status}`}>{transfer.status}</span>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 )
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default Dashboard














"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import axios from "axios"
import "../styles/Dashboard.css"

const Dashboard = () => {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filters, setFilters] = useState({
    base: "",
    assetType: "all",
    startDate: "",
    endDate: "",
  })
  const [bases, setBases] = useState([])
  const [assetTypes, setAssetTypes] = useState([])
  const [showMovementDetails, setShowMovementDetails] = useState(false)
  const [movementDetails, setMovementDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    fetchBases()
    fetchAssetTypes()
    fetchMetrics()
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [filters])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchMetrics()
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [loading, filters])

  const fetchBases = async () => {
    try {
      const response = await axios.get("/dashboard/bases")
      setBases(response.data)
      if (response.data.length === 1) {
        setFilters((prev) => ({ ...prev, base: response.data[0] }))
      }
    } catch (error) {
      console.error("Error fetching bases:", error)
    }
  }

  const fetchAssetTypes = async () => {
    try {
      const response = await axios.get("/dashboard/asset-types")
      setAssetTypes(response.data)
    } catch (error) {
      console.error("Error fetching asset types:", error)
    }
  }

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.base) params.append("base", filters.base)
      if (filters.assetType !== "all") params.append("assetType", filters.assetType)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await axios.get(`/dashboard/metrics?${params}`)
      setMetrics(response.data)
      setError("")
    } catch (error) {
      setError("Failed to fetch dashboard metrics")
      console.error("Error fetching metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMovementDetails = async () => {
    try {
      setLoadingDetails(true)
      const params = new URLSearchParams()
      if (filters.base) params.append("base", filters.base)
      if (filters.assetType !== "all") params.append("assetType", filters.assetType)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await axios.get(`/dashboard/movement-details?${params}`)
      setMovementDetails(response.data)
      setShowMovementDetails(true)
    } catch (error) {
      setError("Failed to fetch movement details")
      console.error("Error fetching movement details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="loading animate-fade-in">
        <div className="loading-spinner animate-spin"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header animate-fade-in">
        <h2>Asset Command Center</h2>
        <p>
          Welcome back, {user?.rank} {user?.firstName} {user?.lastName}
        </p>
        <div className="real-time-indicator">
          <span>Live Data</span>
        </div>
      </div>

      <div className="dashboard-filters animate-slide-in">
        <div className="filter-group">
          <label className="filter-label">Base</label>
          <select
            value={filters.base}
            onChange={(e) => handleFilterChange("base", e.target.value)}
            className="filter-select"
            disabled={bases.length <= 1}
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
          <label className="filter-label">Equipment Type</label>
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

        <button onClick={fetchMetrics} className="btn btn-primary filter-btn">
          Apply Filters
        </button>
      </div>

      {error && <div className="alert alert-error animate-slide-in">{error}</div>}

      {metrics && (
        <>
          <div className="dashboard-grid">
            <div className="dashboard-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="card-header">
                <h3>Opening Balance</h3>
                <span className="card-icon">📊</span>
              </div>
              <div className="card-content">
                <div className="metric">
                  <div className="metric-value">{formatNumber(metrics.openingBalance)}</div>
                  <div className="metric-label">Total Units</div>
                </div>
              </div>
            </div>

            <div className="dashboard-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="card-header">
                <h3>Current Stock</h3>
                <span className="card-icon">📈</span>
              </div>
              <div className="card-content">
                <div className="metric">
                  <div className="metric-value">{formatNumber(metrics.closingBalance)}</div>
                  <div className="metric-label">Available Now</div>
                </div>
              </div>
            </div>

            <div
              className="dashboard-card clickable animate-fade-in"
              style={{ animationDelay: "0.3s" }}
              onClick={fetchMovementDetails}
            >
              <div className="card-header">
                <h3>Net Movement</h3>
                <span className="card-icon">🔄</span>
              </div>
              <div className="card-content">
                <div className="metric">
                  <div className="metric-value">{formatNumber(metrics.netMovement)}</div>
                  <div className="metric-label">Click for Details</div>
                </div>
              </div>
            </div>

            <div className="dashboard-card animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="card-header">
                <h3>Active Assignments</h3>
                <span className="card-icon">👥</span>
              </div>
              <div className="card-content">
                <div className="metric">
                  <div className="metric-value">{formatNumber(metrics.assigned)}</div>
                  <div className="metric-label">In Field</div>
                </div>
              </div>
            </div>

            <div className="dashboard-card animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="card-header">
                <h3>Mission Expenditure</h3>
                <span className="card-icon">📉</span>
              </div>
              <div className="card-content">
                <div className="metric">
                  <div className="metric-value">{formatNumber(metrics.expended)}</div>
                  <div className="metric-label">Operational Use</div>
                </div>
              </div>
            </div>

            <div className="dashboard-card animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="card-header">
                <h3>Movement Analysis</h3>
                <span className="card-icon">📋</span>
              </div>
              <div className="card-content">
                <div className="movement-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Acquisitions:</span>
                    <span className="breakdown-value">{formatNumber(metrics.purchases)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Incoming:</span>
                    <span className="breakdown-value">{formatNumber(metrics.transferIn)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Outgoing:</span>
                    <span className="breakdown-value">{formatNumber(metrics.transferOut)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {Object.keys(metrics.assetsByType).length > 0 && (
            <div className="dashboard-section">
              <h3>Assets by Type</h3>
              <div className="asset-type-grid">
                {Object.entries(metrics.assetsByType).map(([type, data]) => (
                  <div key={type} className="asset-type-card">
                    <h4>{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                    <div className="asset-type-metrics">
                      <div className="asset-metric">
                        <span className="metric-label">Opening:</span>
                        <span className="metric-value">{formatNumber(data.openingBalance)}</span>
                      </div>
                      <div className="asset-metric">
                        <span className="metric-label">Closing:</span>
                        <span className="metric-value">{formatNumber(data.closingBalance)}</span>
                      </div>
                      <div className="asset-metric">
                        <span className="metric-label">Net Movement:</span>
                        <span className="metric-value">{formatNumber(data.netMovement)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {metrics.recentActivity.length > 0 && (
            <div className="dashboard-section">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {metrics.recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">{activity.type === "purchase" ? "🛒" : "🚚"}</div>
                    <div className="activity-content">
                      <div className="activity-description">{activity.description}</div>
                      <div className="activity-meta">
                        <span className="activity-user">
                          {activity.user?.rank} {activity.user?.firstName} {activity.user?.lastName}
                        </span>
                        <span className="activity-date">{formatDate(activity.date)}</span>
                        <span className={`activity-status status-${activity.status}`}>{activity.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showMovementDetails && (
        <div className="modal-overlay" onClick={() => setShowMovementDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Movement Details</h3>
              <button className="modal-close" onClick={() => setShowMovementDetails(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {loadingDetails ? (
                <div className="loading">
                  <div className="loading-spinner animate-spin"></div>
                  <p>Loading details...</p>
                </div>
              ) : (
                movementDetails && (
                  <div className="movement-details">
                    <div className="detail-section">
                      <h4>Purchases ({movementDetails.purchases.length})</h4>
                      <div className="detail-list">
                        {movementDetails.purchases.map((purchase) => (
                          <div key={purchase.id} className="detail-item">
                            <div className="detail-main">
                              <span className="detail-name">{purchase.assetName}</span>
                              <span className="detail-quantity">
                                {purchase.quantity} {purchase.unit}
                              </span>
                            </div>
                            <div className="detail-meta">
                              <span className="detail-vendor">{purchase.vendor}</span>
                              <span className="detail-date">{formatDate(purchase.date)}</span>
                              <span className={`detail-status status-${purchase.status}`}>{purchase.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Transfers In ({movementDetails.transfersIn.length})</h4>
                      <div className="detail-list">
                        {movementDetails.transfersIn.map((transfer) => (
                          <div key={transfer.id} className="detail-item">
                            <div className="detail-main">
                              <span className="detail-name">{transfer.assetName}</span>
                              <span className="detail-quantity">
                                {transfer.quantity} {transfer.unit}
                              </span>
                            </div>
                            <div className="detail-meta">
                              <span className="detail-from">From: {transfer.fromBase}</span>
                              <span className="detail-date">{formatDate(transfer.date)}</span>
                              <span className={`detail-status status-${transfer.status}`}>{transfer.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Transfers Out ({movementDetails.transfersOut.length})</h4>
                      <div className="detail-list">
                        {movementDetails.transfersOut.map((transfer) => (
                          <div key={transfer.id} className="detail-item">
                            <div className="detail-main">
                              <span className="detail-name">{transfer.assetName}</span>
                              <span className="detail-quantity">
                                {transfer.quantity} {transfer.unit}
                              </span>
                            </div>
                            <div className="detail-meta">
                              <span className="detail-to">To: {transfer.toBase}</span>
                              <span className="detail-date">{formatDate(transfer.date)}</span>
                              <span className={`detail-status status-${transfer.status}`}>{transfer.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
