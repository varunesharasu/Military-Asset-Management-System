import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import Login from "./components/Login"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import Purchases from "./pages/Purchases"
import Transfers from "./pages/Transfers"
import Assignments from "./pages/Assignments"
import AuditLogs from "./pages/AuditLogs"
import "./App.css"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchases"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Purchases />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transfers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Transfers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Assignments />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AuditLogs />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
