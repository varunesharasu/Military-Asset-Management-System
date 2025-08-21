import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./styles/index.css"
import { NotificationProvider } from "./context/NotificationContext"

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>,
)
