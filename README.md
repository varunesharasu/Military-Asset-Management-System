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
- **Notifications**: System alerts for critical events and updates.
- **Data Seeding**: Sample data for quick testing and demonstration.

---

## Tech Stack
- **Frontend**: React 19, React Router, Axios, CSS Modules
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Authentication**: JWT, bcryptjs
- **Validation**: express-validator
- **Environment**: dotenv

---

## Folder Structure
```
client/           # React frontend
  src/
    components/   # UI components (Dashboard, Login, Assignments, etc.)
    context/      # Auth and Notification context providers
    styles/       # CSS files for each component
    assets/       # Images and icons
  public/         # Static files
  package.json    # Frontend dependencies

server/           # Node.js backend
  models/         # Mongoose schemas (Asset, User, Purchase, etc.)
  routes/         # API endpoints (auth, assets, purchases, etc.)
  middleware/     # Auth middleware
  server.js       # Main server file
  package.json    # Backend dependencies

scripts/
  seed-sample-data.js # Data seeding script
```

---

## Data Models
### Asset
- assetId, name, type (vehicle, weapon, etc.), category, description, unit, currentBase, status, condition, serialNumber, manufacturer, model, acquisitionDate, maintenance dates, value, isActive

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

---

## Sample Data & Testing
Run the seeding script to populate the database with sample users, assets, purchases, and balances:
```sh
cd scripts
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
3. **Configure environment variables**
   - Create `.env` in `server/` with:
     ```
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     PORT=5000
     ```
4. **Seed sample data** (optional):
   - `cd scripts && node seed-sample-data.js`
5. **Run the backend**:
   - `cd server && npm start`
6. **Run the frontend**:
   - `cd client && npm start`

---

## Usage
- Access the frontend at [http://localhost:3000](http://localhost:3000)
- Backend API runs at [http://localhost:5000](http://localhost:5000)
- Login with sample credentials or register new users (admin only)
- Explore dashboard, manage assets, view activity, and test notifications

---

## Security
- Passwords are hashed using bcryptjs
- JWT-based authentication for all protected routes
- Role-based access control
- All activities are logged and monitored

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

## Screenshots
*Add screenshots of dashboard, login, and asset management UI here*

---

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## Additional Resources
- [React Documentation](https://reactjs.org/)
- [Express Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
