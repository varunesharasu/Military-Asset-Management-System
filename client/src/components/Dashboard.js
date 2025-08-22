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

//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (!loading) {
//         fetchMetrics()
//       }
//     }, 30000) // Update every 30 seconds

//     return () => clearInterval(interval)
//   }, [loading, filters])

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
//       <div className="loading animate-fade-in">
//         <div className="loading-spinner animate-spin"></div>
//         <p>Loading dashboard...</p>
//       </div>
//     )
//   }

//   return (
//     <div className="dashboard">
//       <div className="dashboard-header animate-fade-in">
//         <h2>Asset Command Center</h2>
//         <p>
//           Welcome back, {user?.rank} {user?.firstName} {user?.lastName}
//         </p>
//         <div className="real-time-indicator">
//           <span>Live Data</span>
//         </div>
//       </div>

//       <div className="dashboard-filters animate-slide-in">
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

//       {error && <div className="alert alert-error animate-slide-in">{error}</div>}

//       {metrics && (
//         <>
//           <div className="dashboard-grid">
//             <div className="dashboard-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
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

//             <div className="dashboard-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
//               <div className="card-header">
//                 <h3>Current Stock</h3>
//                 <span className="card-icon">📈</span>
//               </div>
//               <div className="card-content">
//                 <div className="metric">
//                   <div className="metric-value">{formatNumber(metrics.closingBalance)}</div>
//                   <div className="metric-label">Available Now</div>
//                 </div>
//               </div>
//             </div>

//             <div
//               className="dashboard-card clickable animate-fade-in"
//               style={{ animationDelay: "0.3s" }}
//               onClick={fetchMovementDetails}
//             >
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

//             <div className="dashboard-card animate-fade-in" style={{ animationDelay: "0.4s" }}>
//               <div className="card-header">
//                 <h3>Active Assignments</h3>
//                 <span className="card-icon">👥</span>
//               </div>
//               <div className="card-content">
//                 <div className="metric">
//                   <div className="metric-value">{formatNumber(metrics.assigned)}</div>
//                   <div className="metric-label">In Field</div>
//                 </div>
//               </div>
//             </div>

//             <div className="dashboard-card animate-fade-in" style={{ animationDelay: "0.5s" }}>
//               <div className="card-header">
//                 <h3>Mission Expenditure</h3>
//                 <span className="card-icon">📉</span>
//               </div>
//               <div className="card-content">
//                 <div className="metric">
//                   <div className="metric-value">{formatNumber(metrics.expended)}</div>
//                   <div className="metric-label">Operational Use</div>
//                 </div>
//               </div>
//             </div>

//             <div className="dashboard-card animate-fade-in" style={{ animationDelay: "0.6s" }}>
//               <div className="card-header">
//                 <h3>Movement Analysis</h3>
//                 <span className="card-icon">📋</span>
//               </div>
//               <div className="card-content">
//                 <div className="movement-breakdown">
//                   <div className="breakdown-item">
//                     <span className="breakdown-label">Acquisitions:</span>
//                     <span className="breakdown-value">{formatNumber(metrics.purchases)}</span>
//                   </div>
//                   <div className="breakdown-item">
//                     <span className="breakdown-label">Incoming:</span>
//                     <span className="breakdown-value">{formatNumber(metrics.transferIn)}</span>
//                   </div>
//                   <div className="breakdown-item">
//                     <span className="breakdown-label">Outgoing:</span>
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
//                   <div className="loading-spinner animate-spin"></div>
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
import Notifications from './Notifications';

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

  if (loading && !metrics) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="modern-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h3>Initializing Dashboard</h3>
          <p>Loading your asset management data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-dashboard">
      {/* Header Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Live Dashboard
          </div>
          <h1 className="hero-title">Asset Command Center</h1>
          <p className="hero-subtitle">
            Welcome back, <strong>{user?.rank} {user?.firstName} {user?.lastName}</strong>
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">{formatNumber(metrics?.closingBalance || 0)}</span>
              <span className="stat-label">Total Assets</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{formatNumber(metrics?.assigned || 0)}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{formatNumber(metrics?.netMovement || 0)}</span>
              <span className="stat-label">Net Movement</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-elements">
            <div className="float-element" style={{ animationDelay: '0s' }}>📊</div>
            <div className="float-element" style={{ animationDelay: '1s' }}>📈</div>
            <div className="float-element" style={{ animationDelay: '2s' }}>🔄</div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="filters-container">
        <div className="filters-header">
          <h3>Filter & Analyze</h3>
          <div className="sync-indicator">
            <div className="sync-dot"></div>
            <span>Auto-sync enabled</span>
          </div>
        </div>
        <div className="filters-grid">
          <div className="filter-item">
            <label>Base Location</label>
            <select
              value={filters.base}
              onChange={(e) => handleFilterChange("base", e.target.value)}
              disabled={bases.length <= 1}
            >
              <option value="">All Bases</option>
              {bases.map((base) => (
                <option key={base} value={base}>{base}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Asset Category</label>
            <select
              value={filters.assetType}
              onChange={(e) => handleFilterChange("assetType", e.target.value)}
            >
              <option value="all">All Categories</option>
              {assetTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Date Range</label>
            <div className="date-inputs">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                placeholder="Start Date"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                placeholder="End Date"
              />
            </div>
          </div>

          <div className="filter-item">
            <label>&nbsp;</label>
            <button onClick={fetchMetrics} className="apply-filters-btn">
              <span>Apply Filters</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M13 7L18 12L13 17M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-container">
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        </div>
      )}

      {metrics && (
        <>
          {/* Main Metrics Grid */}
          <div className="metrics-section">
            <div className="section-header">
              <h2>Key Performance Indicators</h2>
              <div className="last-updated">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
            
            <div className="metrics-grid">
              <div className="metric-card primary" style={{ animationDelay: '0.1s' }}>
                <div className="card-icon-wrapper">
                  <div className="card-icon">📊</div>
                </div>
                <div className="card-content">
                  <h3>Opening Balance</h3>
                  <div className="metric-value">{formatNumber(metrics.openingBalance)}</div>
                  <p className="metric-description">Initial inventory count</p>
                </div>
                <div className="card-trend positive">
                  <span className="trend-indicator">↗</span>
                </div>
              </div>

              <div className="metric-card success" style={{ animationDelay: '0.2s' }}>
                <div className="card-icon-wrapper">
                  <div className="card-icon">📈</div>
                </div>
                <div className="card-content">
                  <h3>Current Stock</h3>
                  <div className="metric-value">{formatNumber(metrics.closingBalance)}</div>
                  <p className="metric-description">Available inventory</p>
                </div>
                <div className="card-trend positive">
                  <span className="trend-indicator">↗</span>
                </div>
              </div>

              <div 
                className="metric-card interactive warning" 
                style={{ animationDelay: '0.3s' }}
                onClick={fetchMovementDetails}
              >
                <div className="card-icon-wrapper">
                  <div className="card-icon">🔄</div>
                </div>
                <div className="card-content">
                  <h3>Net Movement</h3>
                  <div className="metric-value">{formatNumber(metrics.netMovement)}</div>
                  <p className="metric-description">Click for detailed breakdown</p>
                </div>
                <div className="card-hover-indicator">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              <div className="metric-card info" style={{ animationDelay: '0.4s' }}>
                <div className="card-icon-wrapper">
                  <div className="card-icon">👥</div>
                </div>
                <div className="card-content">
                  <h3>Active Assignments</h3>
                  <div className="metric-value">{formatNumber(metrics.assigned)}</div>
                  <p className="metric-description">Currently deployed</p>
                </div>
                <div className="card-trend neutral">
                  <span className="trend-indicator">→</span>
                </div>
              </div>

              <div className="metric-card danger" style={{ animationDelay: '0.5s' }}>
                <div className="card-icon-wrapper">
                  <div className="card-icon">📉</div>
                </div>
                <div className="card-content">
                  <h3>Expenditure</h3>
                  <div className="metric-value">{formatNumber(metrics.expended)}</div>
                  <p className="metric-description">Mission consumption</p>
                </div>
                <div className="card-trend negative">
                  <span className="trend-indicator">↘</span>
                </div>
              </div>

              <div className="metric-card analysis" style={{ animationDelay: '0.6s' }}>
                <div className="card-content full-width">
                  <h3>Movement Analysis</h3>
                  <div className="analysis-grid">
                    <div className="analysis-item">
                      <div className="analysis-label">Acquisitions</div>
                      <div className="analysis-value success">{formatNumber(metrics.purchases)}</div>
                    </div>
                    <div className="analysis-item">
                      <div className="analysis-label">Incoming</div>
                      <div className="analysis-value info">{formatNumber(metrics.transferIn)}</div>
                    </div>
                    <div className="analysis-item">
                      <div className="analysis-label">Outgoing</div>
                      <div className="analysis-value warning">{formatNumber(metrics.transferOut)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assets by Type Section */}
          {Object.keys(metrics.assetsByType).length > 0 && (
            <div className="section-container">
              <div className="section-header">
                <h2>Asset Categories</h2>
                <div className="section-badge">{Object.keys(metrics.assetsByType).length} Categories</div>
              </div>
              
              <div className="asset-types-grid">
                {Object.entries(metrics.assetsByType).map(([type, data], index) => (
                  <div key={type} className="asset-type-card" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="asset-type-header">
                      <h4>{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                      <div className="type-indicator"></div>
                    </div>
                    <div className="asset-type-metrics">
                      <div className="asset-metric">
                        <span className="metric-label">Opening</span>
                        <span className="metric-value">{formatNumber(data.openingBalance)}</span>
                      </div>
                      <div className="asset-metric">
                        <span className="metric-label">Current</span>
                        <span className="metric-value highlight">{formatNumber(data.closingBalance)}</span>
                      </div>
                      <div className="asset-metric">
                        <span className="metric-label">Movement</span>
                        <span className={`metric-value ${data.netMovement >= 0 ? 'positive' : 'negative'}`}>
                          {data.netMovement >= 0 ? '+' : ''}{formatNumber(data.netMovement)}
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${Math.min(100, (data.closingBalance / Math.max(data.openingBalance, 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity Section */}
          {metrics.recentActivity.length > 0 && (
            <div className="section-container">
              <div className="section-header">
                <h2>Recent Activity</h2>
                <div className="section-badge">{metrics.recentActivity.length} Activities</div>
              </div>
              
              <div className="activity-timeline">
                {metrics.recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="activity-marker">
                      <div className="activity-icon">
                        {activity.type === "purchase" ? "🛒" : "🚚"}
                      </div>
                    </div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <h4>{activity.description}</h4>
                        <span className={`activity-status ${activity.status}`}>
                          {activity.status}
                        </span>
                      </div>
                      <div className="activity-meta">
                        <div className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          {activity.user?.rank} {activity.user?.firstName} {activity.user?.lastName}
                        </div>
                        <div className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          {formatDate(activity.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Enhanced Modal */}
      {showMovementDetails && (
        <div className="modern-modal-overlay" onClick={() => setShowMovementDetails(false)}>
          <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Movement Details</h2>
                <p>Comprehensive transaction breakdown</p>
              </div>
              <button 
                className="modal-close" 
                onClick={() => setShowMovementDetails(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              {loadingDetails ? (
                <div className="modal-loading">
                  <div className="loading-spinner small"></div>
                  <p>Loading detailed information...</p>
                </div>
              ) : (
                movementDetails && (
                  <div className="movement-details">
                    {/* Purchases */}
                    <div className="detail-section">
                      <div className="detail-section-header">
                        <h3>Purchases</h3>
                        <span className="count-badge">{movementDetails.purchases.length}</span>
                      </div>
                      <div className="detail-list">
                        {movementDetails.purchases.map((purchase) => (
                          <div key={purchase.id} className="detail-item">
                            <div className="detail-icon">🛒</div>
                            <div className="detail-content">
                              <div className="detail-main">
                                <h4>{purchase.assetName}</h4>
                                <span className="detail-quantity">
                                  {purchase.quantity} {purchase.unit}
                                </span>
                              </div>
                              <div className="detail-meta">
                                <span className="vendor">Vendor: {purchase.vendor}</span>
                                <span className="date">{formatDate(purchase.date)}</span>
                                <span className={`status ${purchase.status}`}>
                                  {purchase.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Transfers In */}
                    <div className="detail-section">
                      <div className="detail-section-header">
                        <h3>Incoming Transfers</h3>
                        <span className="count-badge">{movementDetails.transfersIn.length}</span>
                      </div>
                      <div className="detail-list">
                        {movementDetails.transfersIn.map((transfer) => (
                          <div key={transfer.id} className="detail-item">
                            <div className="detail-icon">📥</div>
                            <div className="detail-content">
                              <div className="detail-main">
                                <h4>{transfer.assetName}</h4>
                                <span className="detail-quantity">
                                  {transfer.quantity} {transfer.unit}
                                </span>
                              </div>
                              <div className="detail-meta">
                                <span className="from">From: {transfer.fromBase}</span>
                                <span className="date">{formatDate(transfer.date)}</span>
                                <span className={`status ${transfer.status}`}>
                                  {transfer.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Transfers Out */}
                    <div className="detail-section">
                      <div className="detail-section-header">
                        <h3>Outgoing Transfers</h3>
                        <span className="count-badge">{movementDetails.transfersOut.length}</span>
                      </div>
                      <div className="detail-list">
                        {movementDetails.transfersOut.map((transfer) => (
                          <div key={transfer.id} className="detail-item">
                            <div className="detail-icon">📤</div>
                            <div className="detail-content">
                              <div className="detail-main">
                                <h4>{transfer.assetName}</h4>
                                <span className="detail-quantity">
                                  {transfer.quantity} {transfer.unit}
                                </span>
                              </div>
                              <div className="detail-meta">
                                <span className="to">To: {transfer.toBase}</span>
                                <span className="date">{formatDate(transfer.date)}</span>
                                <span className={`status ${transfer.status}`}>
                                  {transfer.status}
                                </span>
                              </div>
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

      <Notifications />
    </div>
  )
}

export default Dashboard