# Military Asset Management System (MAMS)

## Overview
Military Asset Management System (MAMS) is a full-stack web application designed to manage, track, and analyze military assets across multiple bases. It provides secure authentication, real-time dashboards, asset movement tracking, and role-based access for administrators, base commanders, and logistics officers.

---

## Features
- **Secure Authentication**: Role-based login for admin, base commander, and logistics officer.
- **Asset Management**: CRUD operations for vehicles, weapons, ammunition, equipment, and supplies.
- **Purchases & Transfers**: Track asset acquisitions, incoming/outgoing transfers, and mission expenditures.
- **Assignments**: Assign assets to personnel or missions and monitor their status.
- **Dashboard**: Real-time metrics, KPIs, and activity timeline for asset movement and stock levels.
- **Movement Details**: Detailed breakdown of purchases, transfers in/out accessible via dashboard.
- **Notifications**: System alerts for critical events and updates.
- **Data Seeding**: Sample data for quick testing and demonstration.
- **API Logging**: Complete audit trail of all transactions and operations.
- **Role-Based Access Control**: Comprehensive RBAC implementation with middleware protection.

---

## Tech Stack
- **Frontend**: React 19, React Router, Axios, CSS Modules
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Authentication**: JWT, bcryptjs
- **Validation**: express-validator
- **Logging**: Custom middleware for transaction logging
- **Environment**: dotenv

---

## Folder Structure
```
client/           # React frontend
  src/
    components/   # UI components (Dashboard, Login, Assignments, etc.)
    context/      # Auth and Notification context providers
    styles/       # CSS files for each component
  public/         # Static files
  package.json    # Frontend dependencies

server/           # Node.js backend
  models/         # Mongoose schemas (Asset, User, Purchase, etc.)
  routes/         # API endpoints (auth, assets, purchases, etc.)
  middleware/     # Auth middleware
  server.js       # Main server file
  package.json    # Backend dependencies
  .env.example    # Environment variables template

scripts/
  seed-sample-data.js # Data seeding script

logs/             # API transaction logs
```

---

## Data Models
### Asset
- assetId, name, type (vehicle, weapon, etc.), category, description, unit, currentBase, status, condition, serialNumber, manufacturer, model, acquisitionDate, maintenance dates, value, isActive
- **Quantities**: totalQuantity, availableQuantity, assignedQuantity, expendedQuantity

### User
- username, email, password (hashed), role (admin, base_commander, logistics_officer), assignedBase, firstName, lastName, rank, isActive

### Purchase, Transfer, Assignment, Balance
- Linked to assets and users, track movement, status, quantities, dates, and financials

---

## API Endpoints
- `/api/auth` - Register, login, profile management
- `/api/assets` - Asset CRUD (placeholder, extendable)
- `/api/purchases` - Purchase records
- `/api/transfers` - Asset transfers
- `/api/assignments` - Asset assignments
- `/api/dashboard` - Metrics, asset types, bases, movement details
- `/api/notifications` - System notifications

### Role-Based Access Control
- **Admin**: Full access to all endpoints and data across all bases
- **Base Commander**: Access to data for assigned base only (dashboard, assignments, transfers)
- **Logistics Officer**: Limited access to purchases and transfers for assigned base
---

## Sample Data & Testing
Run the seeding script to populate the database with sample users, assets, purchases, and balances:
```sh
cd scripts
npm install
node seed-sample-data.js
```

Sample credentials:
- **Admin**: `admin` / `admin123`
- **Base Commander**: `base1_commander` / `commander123`
- **Logistics Officer**: `logistics1` / `logistics123`

---

## Getting Started
### Prerequisites
- Node.js & npm
- MongoDB (local or Atlas)

### Setup
1. **Clone the repository**
2. **Install dependencies**
   - Frontend: `cd client && npm install`
   - Backend: `cd server && npm install`
   - Scripts: `cd scripts && npm install`
3. **Configure environment variables**
   - Copy `server/.env.example` to `server/.env`
   - Update the values in `.env` with your MongoDB connection string and JWT secret
4. **Seed sample data** (optional):
   - `cd scripts && npm install && node seed-sample-data.js`
5. **Run the backend**:
   - `cd server && npm start` (runs on http://localhost:5000)
6. **Run the frontend**:
   - `cd client && npm start` (runs on http://localhost:3000)

---

## Usage
- Access the frontend at [http://localhost:3000](http://localhost:3000)
- Backend API runs at [http://localhost:5000](http://localhost:5000)
- Login with sample credentials or register new users (admin only)
- Explore dashboard, manage assets, view activity, and test notifications
- **Dashboard Features**:
  - View key metrics: Opening Balance, Closing Balance, Net Movement, Assigned, Expended
  - Filter by Date, Base, and Equipment Type
  - Click "Net Movement" for detailed breakdown of Purchases, Transfers In/Out
- **Role-Based Features**:
  - Admin: Access all bases and full system functionality
  - Base Commander: Manage assignments and view transfers for assigned base
  - Logistics Officer: Handle purchases and transfers for assigned base

---

## Security
- Passwords are hashed using bcryptjs
- JWT-based authentication for all protected routes
- All activities are logged and monitored
- API endpoints protected with authentication middleware
- Base-level access control for non-admin users
- Transaction logging for complete audit trail

---

## API Logging
All transactions are automatically logged to `/logs/api.log` including:
- User authentication and authorization
- Purchase creation and updates
- Transfer operations
- Assignment management
- Timestamp, user, endpoint, and request data

---

## License
MIT

---

## Contact & Support
- Email: support@military.gov
- Phone: 1-800-MILITARY

---

## Credits
Developed by varunesharasu

---

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## Additional Resources
- [React Documentation](https://reactjs.org/)
- [Express Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
