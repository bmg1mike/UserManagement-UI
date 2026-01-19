# AML User Management Portal

A modern web application for managing portal users in the United Bank for Africa (UBA) Actimize Anti-Money Laundering (AML) system. Built with React, TypeScript, and Tailwind CSS.

## 🎯 Project Overview

This portal provides a secure interface for administrators to manage users, perform bulk operations, and maintain access control for the Actimize AML platform. The application features robust authentication with 2FA, real-time search and filtering, and comprehensive user management capabilities.

## ✨ Features

### Authentication & Security
- 🔐 Email/password login with JWT tokens
- 🔑 Two-Factor Authentication (2FA)
- 🔄 Automatic token refresh
- 🚪 Secure logout with session cleanup

### User Management
- 👥 View all portal users with pagination (10 per page)
- 🔍 Real-time search across email, name, role, business unit, SOLID
- 🎯 Advanced filtering by role, business unit, and status
- ➕ Add new users with form validation
- 📊 Active/Inactive status badges

### Bulk Operations
- 📤 Bulk user upload via Excel (.xlsx) files
- 📥 Download Excel template with proper formatting
- 📋 Export all users to Excel
- ✅ Upload success/failure reporting

### UI/UX
- 🎨 UBA brand colors and logo integration
- 📱 Responsive design (desktop and mobile)
- 🌓 Dark mode support
- ♿ Accessible components
- 🎭 Collapsible sidebar navigation
- 🔔 Toast notifications and modal alerts

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18.3.1
- **Language:** TypeScript
- **Build Tool:** Vite 6.x
- **Styling:** Tailwind CSS v4 with `@tailwindcss/vite`
- **UI Components:** shadcn/ui (Radix UI)
- **Icons:** Feather Icons via react-icons

### State & Data Management
- **Server State:** TanStack Query (React Query)
- **Client State:** Zustand
- **HTTP Client:** Axios with interceptors
- **Routing:** React Router DOM v6

### Other Libraries
- **Alerts:** SweetAlert2
- **Excel:** xlsx (for bulk operations)

### DevOps
- **Containerization:** Docker with multi-stage builds
- **Web Server:** Nginx (Alpine)
- **CI/CD Ready:** Dockerfile and .dockerignore configured

## 📋 Prerequisites

- Node.js 20.x or higher
- npm or yarn package manager
- Docker (optional, for containerized deployment)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ActimizeUserManagementPortal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=https://actimizemduat.ubagroup.com:8444/api
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t aml-user-management .
```

To build with a custom API URL:

```bash
docker build --build-arg VITE_API_BASE_URL=https://your-api.com/api -t aml-user-management .
```

### Run Docker Container

```bash
docker run -d -p 8080:80 --name aml-user-management aml-user-management
```

Access the app at `http://localhost:8080`

### Docker Commands

```bash
# Stop container
docker stop aml-user-management

# Remove container
docker rm aml-user-management

# View logs
docker logs aml-user-management

# List running containers
docker ps
```

## 📁 Project Structure

```
ActimizeUserManagementPortal/
├── public/
│   └── logo.svg                 # UBA logo
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AuthLayout.tsx   # Layout wrapper with sidebar
│   │   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   │   └── index.ts
│   │   ├── ui/                  # shadcn/ui components
│   │   └── users/
│   │       └── AddUserModal.tsx # Add user dialog
│   ├── lib/
│   │   ├── axios.ts             # Axios instance with interceptors
│   │   ├── sweet-alert.ts       # SweetAlert2 wrapper
│   │   └── utils.ts             # Utility functions
│   ├── pages/
│   │   ├── LoginPage.tsx        # Login page
│   │   ├── TwoFactorPage.tsx    # 2FA verification
│   │   ├── DashboardPage.tsx    # Dashboard (placeholder)
│   │   ├── UsersPage.tsx        # User management
│   │   └── BulkUploadPage.tsx   # Bulk upload interface
│   ├── App.tsx                  # Main app component with routes
│   ├── main.tsx                 # App entry point
│   └── index.css                # Global styles
├── .env                         # Environment variables
├── .dockerignore                # Docker ignore rules
├── Dockerfile                   # Multi-stage Docker build
├── nginx.conf                   # Nginx configuration
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite configuration
└── README.md                    # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /Auth/login` - User login (returns temp token)
- `POST /Auth/verify-2fa` - Verify 2FA code (returns access/refresh tokens)
- `POST /Auth/logout` - Logout user

### User Management
- `GET /PortalUser/GetUsers` - Fetch all users
- `POST /PortalUser/AddUser` - Create new user
- `POST /PortalUser/BulkAddUsers` - Bulk upload users (Excel)
- `GET /PortalUser/ExportUsers` - Export users to Excel

## 🔒 Authentication Flow

1. **Login:** User enters email/password → receives temporary token
2. **2FA:** User enters verification code with temp token → receives access token and refresh token
3. **Authorized Requests:** All API calls include `Authorization: Bearer <accessToken>`
4. **Token Refresh:** On 401 error, system automatically refreshes using refresh token
5. **Logout:** Calls logout endpoint and clears all local storage

## 🎨 Styling & Theming

### UBA Brand Colors
- **Primary (Red):** `#D71920`
- **Background:** Tailwind's default with muted variants
- **Dark Mode:** Supported via Tailwind CSS

### Component Library
- shadcn/ui components (installed via CLI)
- Customizable via `components.json`
- Radix UI primitives for accessibility

## 📦 Key Dependencies

```json
{
  "@tanstack/react-query": "^5.62.11",
  "axios": "^1.7.9",
  "react": "^18.3.1",
  "react-router-dom": "^7.1.3",
  "sweetalert2": "^11.15.3",
  "xlsx": "^0.18.5",
  "zustand": "^5.0.3"
}
```

## 🧪 Development Workflow

### Available Scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Code Organization
- **Pages:** Top-level components for each route
- **Components:** Reusable UI components organized by domain
- **Lib:** Utility functions, API clients, and configurations
- **Types:** TypeScript interfaces (defined inline in components)

## 🔧 Configuration Files

### `vite.config.ts`
- Configures path aliases (`@/` → `src/`)
- Tailwind CSS plugin integration
- Build optimizations

### `tsconfig.json`
- TypeScript compiler options
- Path mappings for clean imports

### `nginx.conf`
- Supports client-side routing (SPA)
- Gzip compression enabled
- 20MB max upload size

## 🌐 Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the client:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `https://actimizemduat.ubagroup.com:8444/api` |

## 🐛 Troubleshooting

### Issue: 401 Unauthorized
- Check if access token is expired
- Verify API base URL in `.env`
- Ensure refresh token is valid

### Issue: Build Fails in Docker
- Run `docker system prune -f` to clean cache
- Verify `package-lock.json` exists
- Check `Dockerfile` and `nginx.conf` syntax

### Issue: Can't Access App on localhost:8080
- Verify container is running: `docker ps`
- Check logs: `docker logs aml-user-management`
- Ensure port 8080 is not in use

## 📝 User Roles

- **IMTO** - Internal Money Transfer Operator
- **USERACCESS** - User Access Administrator

## 🗺️ Roadmap

- [ ] Edit user functionality
- [ ] Delete user functionality
- [ ] User activity logs
- [ ] Advanced role permissions
- [ ] Multi-language support

## 👥 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly (dev server and Docker)
4. Submit a pull request

## 📄 License

Proprietary - United Bank for Africa (UBA)

## 📞 Support

For issues or questions, contact the development team at [support@ubagroup.com](mailto:support@ubagroup.com)

---

**Built with ❤️ for UBA by the Digital Banking Team**

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Development Guidelines

- Use functional components with hooks
- Follow TypeScript best practices
- Use proper type definitions for all props and state
