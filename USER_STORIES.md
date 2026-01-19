# User Stories - AML User Management Portal

## Project Overview
The AML User Management Portal is a web application built for United Bank for Africa (UBA) to manage portal users for the Actimize Anti-Money Laundering system. The application provides secure authentication, user management, and bulk operations capabilities.

---

## Epic 1: Authentication & Security

### US-001: User Login
**As a** portal administrator  
**I want to** log in with my email and password  
**So that** I can securely access the user management system

**Acceptance Criteria:**
- User can enter email and password
- System validates credentials against the backend API
- Upon successful login, user receives a temporary token for 2FA
- Invalid credentials display an error message
- UBA branding (logo and colors) is displayed on the login page

---

### US-002: Two-Factor Authentication
**As a** portal administrator  
**I want to** complete 2FA verification after login  
**So that** my account remains secure with an additional layer of protection

**Acceptance Criteria:**
- User is redirected to 2FA page after successful login
- User can enter a 6-digit verification code
- System validates the code using the temporary token
- Upon successful verification, user receives access and refresh tokens
- User is redirected to the Users page
- Failed verification shows an error and redirects to login

---

### US-003: Secure Session Management
**As a** portal administrator  
**I want** my session to be automatically refreshed  
**So that** I don't get logged out during active use

**Acceptance Criteria:**
- Access token is stored securely in localStorage
- System automatically refreshes expired access tokens using the refresh token
- 401 errors trigger automatic token refresh
- If refresh fails, user is redirected to login page
- User info is stored and displayed throughout the session

---

### US-004: Logout
**As a** portal administrator  
**I want to** securely log out of the system  
**So that** no one else can access my account on the same device

**Acceptance Criteria:**
- User can click a logout button in the sidebar
- System prompts for confirmation before logging out
- Logout API is called to invalidate server-side session
- All local tokens and user data are cleared
- User is redirected to the login page

---

## Epic 2: User Management

### US-005: View All Users
**As a** portal administrator  
**I want to** view a list of all portal users  
**So that** I can see who has access to the system

**Acceptance Criteria:**
- Users are displayed in a table with columns: Name, Email, Role, Business Unit, SOLID, Status
- Table shows 10 users per page with pagination controls
- Active users are shown with a green "Active" badge
- Inactive users are shown with a red "Inactive" badge
- Total user count is displayed
- Data can be refreshed manually

---

### US-006: Search Users
**As a** portal administrator  
**I want to** search for users by name, email, role, or other attributes  
**So that** I can quickly find specific users

**Acceptance Criteria:**
- Search box is available at the top of the users table
- Search filters results in real-time
- Search works across: email, first name, last name, role, business unit, and SOLID
- Search is case-insensitive
- Pagination resets to page 1 when searching

---

### US-007: Filter Users
**As a** portal administrator  
**I want to** filter users by role, business unit, and status  
**So that** I can view specific groups of users

**Acceptance Criteria:**
- Three filter dropdowns are available: Role, Business Unit, Status
- Role filter shows all available roles (IMTO, USERACCESS)
- Business Unit filter shows all countries/units
- Status filter allows selecting Active/Inactive users
- Filters can be combined
- A "Clear Filters" button resets all filters
- Active filters are visually indicated

---

### US-008: Add New User
**As a** portal administrator  
**I want to** add a new user to the system  
**So that** authorized personnel can access the portal

**Acceptance Criteria:**
- "Add User" button opens a modal dialog
- Modal contains fields: Full Name, Email, Role, Business Unit, SOLID
- All fields are required
- Email validation ensures proper format
- Role dropdown shows: IMTO, USERACCESS
- Business Unit dropdown shows all available countries
- Submit button sends data to the backend API
- Success message is displayed upon successful creation
- Error messages are shown inline in the modal (not as popups)
- Users table refreshes automatically after adding a user
- Modal can be closed or cancelled

---

## Epic 3: Bulk Operations

### US-009: Bulk User Upload
**As a** portal administrator  
**I want to** upload multiple users at once using an Excel file  
**So that** I can efficiently onboard many users simultaneously

**Acceptance Criteria:**
- Dedicated "Bulk Upload" page is accessible from the sidebar
- Users can drag and drop an Excel (.xlsx) file
- Users can click to select a file from their system
- Only .xlsx files are accepted
- File validation shows errors for invalid file types
- Upload progress is indicated with a spinner
- Success message shows: total users added, total failures
- API error messages are displayed in an alert dialog
- Upload result is shown with success/failure counts

---

### US-010: Download Bulk Upload Template
**As a** portal administrator  
**I want to** download a template Excel file  
**So that** I know the correct format for bulk uploads

**Acceptance Criteria:**
- "Download Template" button is available on the Bulk Upload page
- Template file is downloaded with name: bulk_users_template.xlsx
- Template contains headers: BusinessUnit, Name, Email Address, SOL ID, Role
- Template includes a sample row with example data
- Instructions page shows the required columns and their descriptions
- File format uses proper Excel (.xlsx) format with column widths

---

### US-011: Export Users
**As a** portal administrator  
**I want to** export all users to an Excel file  
**So that** I can have a backup or analyze user data externally

**Acceptance Criteria:**
- "Export" button is available on the Users page
- Clicking export downloads an Excel file with all users
- File is named with current date: users_export_YYYY-MM-DD.xlsx
- Export includes all user data fields
- Loading spinner is shown during export
- Success toast notification confirms completion
- Error messages are displayed if export fails

---

## Epic 4: User Interface & Navigation

### US-012: Responsive Sidebar Navigation
**As a** portal administrator  
**I want** a collapsible sidebar with navigation options  
**So that** I can easily move between different sections of the application

**Acceptance Criteria:**
- Sidebar displays: UBA logo, Users, Bulk Upload navigation items
- Sidebar can be collapsed/expanded on desktop
- Active page is highlighted in the sidebar
- Mobile view shows a hamburger menu
- Sidebar displays logged-in user's name, email, and avatar initials
- User info is parsed from the logged-in user's email
- Logout button is accessible from the sidebar

---

### US-013: Consistent Branding
**As a** UBA stakeholder  
**I want** the application to use UBA branding  
**So that** it aligns with our corporate identity

**Acceptance Criteria:**
- UBA red (#D71920) is used as the primary color
- UBA logo is displayed in the sidebar and login pages
- Color scheme matches UBA brand guidelines
- All pages use consistent styling and layout

---

## Epic 5: DevOps & Deployment

### US-014: Docker Deployment
**As a** DevOps engineer  
**I want to** deploy the application using Docker  
**So that** it runs consistently across different environments

**Acceptance Criteria:**
- Dockerfile builds the React app in a Node.js container
- Production image serves the app with Nginx
- API base URL can be configured via build argument
- .env file is excluded from Docker image for security
- Application runs on port 80 in the container
- Custom nginx.conf supports client-side routing
- Container can be run with: `docker run -p 8080:80`

---

## Technical Stack
- **Frontend:** React 18.3.1 with TypeScript, Vite
- **Styling:** Tailwind CSS v4, shadcn/ui components
- **State Management:** TanStack Query, Zustand
- **HTTP Client:** Axios with interceptors
- **Icons:** Feather Icons (react-icons)
- **Alerts:** SweetAlert2
- **Authentication:** JWT tokens (access + refresh)
- **Deployment:** Docker with Nginx

---

## API Endpoints
- `POST /Auth/login` - User login
- `POST /Auth/verify-2fa` - Two-factor authentication
- `POST /Auth/logout` - User logout
- `GET /PortalUser/GetUsers` - Fetch all users
- `POST /PortalUser/AddUser` - Create a new user
- `POST /PortalUser/BulkAddUsers` - Bulk user upload (Excel)
- `GET /PortalUser/ExportUsers` - Export users to Excel

---

## Non-Functional Requirements

### NFR-001: Security
- All API calls use Bearer token authentication
- Tokens are stored in localStorage
- Automatic token refresh on expiration
- 2FA required for all logins
- Logout clears all sensitive data

### NFR-002: Performance
- Pagination limits table to 10 rows per page
- Real-time search and filtering
- Optimized Docker image with multi-stage build
- Gzip compression enabled in Nginx

### NFR-003: Usability
- Responsive design for desktop and mobile
- Inline error messages in modals
- Loading states for all async operations
- Confirmation dialogs for destructive actions
- Toast notifications for success messages

### NFR-004: Accessibility
- Semantic HTML elements
- Proper form labels
- Keyboard navigation support
- Clear visual feedback for interactive elements
