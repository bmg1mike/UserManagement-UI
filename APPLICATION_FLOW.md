# AML User Management Portal - Application Flow & Testing Guide

## 📋 Overview

This document provides a comprehensive walkthrough of the AML User Management Portal application flow, designed to help users understand, navigate, and test all features of the system.

---

## 🔐 1. Authentication Flow

### 1.1 Login Page (Entry Point)

**URL:** `http://localhost:5173/` or `http://localhost:8080/`

**Steps:**
1. **Access the Application**
   - Open your browser and navigate to the application URL
   - You'll see the UBA logo and login form

2. **Enter Credentials**
   - **Email:** Your UBA email address (e.g., `michael.boniface@ubagroup.com`)
   - **Password:** Your account password
   - Click the **Sign In** button

3. **Behind the Scenes (Encrypted Login)**
   - Application fetches encryption key and IV from `/Auth/non-fetch` endpoint
   - Your credentials are encrypted using AES-256-CBC
   - Encrypted data is sent to `/Auth/AddtionalEncryptedLogin`
   - Response is decrypted to retrieve a temporary authentication token
   - You're redirected to the 2FA verification page

**Expected Outcome:** Successful redirect to 2FA page with message "Password authenticated. Please complete 2FA."

**Testing Scenarios:**
- ✅ Valid credentials → Redirect to 2FA
- ❌ Invalid email → Error: "Invalid email or password"
- ❌ Invalid password → Error: "Invalid email or password"
- ❌ Empty fields → Warning: "Please fill in all fields"

---

### 1.2 Two-Factor Authentication (2FA)

**URL:** `http://localhost:5173/2fa`

**Steps:**
1. **Open Your Authenticator App**
   - Use Google Authenticator, Microsoft Authenticator, or similar app
   - Locate your UBA AML account entry

2. **Enter Verification Code**
   - Type the 8-digit code from your authenticator app
   - Click **Verify**

3. **Behind the Scenes (Encrypted 2FA)**
   - Token object `{Token: "12345678"}` is created
   - Object is encrypted using AES-256-CBC
   - Encrypted data is sent to `/Auth/EncryptedVerify2FA` with Bearer token
   - Response is decrypted to retrieve:
     - Access Token (for API authentication)
     - Refresh Token (for automatic token renewal)
     - User information (email, business unit, role, SOL ID, user ID)
   - User data is stored in localStorage
   - You're redirected to the Users page

**Expected Outcome:** Successful redirect to `/users` page with message "Verification successful!"

**Testing Scenarios:**
- ✅ Valid 8-digit code → Access granted, redirect to Users page
- ❌ Invalid code → Error: "Verification failed. Please try again." → Redirect to login
- ❌ Expired code → Error: "Verification failed. Please try again." → Redirect to login
- ⬅️ Click "Back to Login" → Return to login page (temp token cleared)

---

## 👥 2. User Management

### 2.1 Users Page (Main Dashboard)

**URL:** `http://localhost:5173/users`

**Page Layout:**
- **Sidebar:** Navigation menu with Users, Bulk Upload, and Logout
- **Header:** Search bar and filters
- **User Avatar:** Displays your initials and email at the bottom of sidebar
- **Action Buttons:** Add User, Export Users
- **Data Table:** Paginated list of all portal users

**Steps:**

#### View All Users
1. The page automatically loads all users on mount
2. Users are displayed in a table with columns:
   - **Name** (full name)
   - **Email**
   - **Business Unit** (e.g., FINANCE, OPERATIONS)
   - **SOL ID** (branch/location identifier)
   - **Role** (e.g., IMTO, USERACCESS)
   - **Status** (Active/Inactive badge)
3. **Pagination:** 10 users per page
   - Use "Previous" and "Next" buttons to navigate
   - Current page indicator shows: "Page X of Y"

#### Search Users
1. Locate the search bar at the top of the page
2. Type any of the following to filter:
   - Email address
   - Name
   - Business Unit
   - SOL ID
   - Role
3. Search is **case-insensitive** and searches across all fields
4. Results update in real-time as you type

**Testing Search:**
- Search by email: `john.doe@ubagroup.com`
- Search by name: `John`
- Search by business unit: `FINANCE`
- Search by SOL ID: `001`
- Search by role: `IMTO`

#### Filter Users
1. **Filter by Role:**
   - Click the "Role" dropdown
   - Select a role (e.g., IMTO, USERACCESS)
   - Table updates to show only users with that role
   - Select "All Roles" to clear filter

2. **Filter by Business Unit:**
   - Click the "Business Unit" dropdown
   - Select a business unit (e.g., FINANCE, OPERATIONS)
   - Table updates to show only users in that unit
   - Select "All Business Units" to clear filter

3. **Filter by Status:**
   - Click the "Status" dropdown
   - Select "Active" or "Inactive"
   - Table updates accordingly
   - Select "All Statuses" to clear filter

4. **Combine Filters:**
   - You can use search + multiple filters simultaneously
   - Example: Search "john" + Role: IMTO + Status: Active

---

### 2.2 Add New User

**Steps:**
1. Click the **+ Add User** button (top-right corner)
2. A modal dialog opens with a form
3. Fill in the following fields:
   - **Business Unit** (dropdown): Select from available business units
   - **Name** (text): Full name of the user
   - **Email Address** (email): Valid email format
   - **SOL ID** (text): Branch/location identifier
   - **Role** (dropdown): Select IMTO or USERACCESS

4. Click **Add User** button
5. **Behind the Scenes:**
   - Form data is sent to `/PortalUser/AddUser` endpoint
   - Access token is automatically included in headers
   - Success/error message from API is displayed

**Expected Outcome:**
- ✅ Success: "User added successfully!" → Modal closes, table refreshes
- ❌ Duplicate email: Error message displayed in modal (inline)
- ❌ Validation errors: Red error message shown below form

**Testing Scenarios:**
- ✅ Valid data → User added successfully
- ❌ Empty required fields → Validation error
- ❌ Invalid email format → "Please enter a valid email"
- ❌ Duplicate email → API error message shown
- ⬅️ Click "Cancel" → Modal closes, no changes made

---

### 2.3 Export Users to Excel

**Steps:**
1. Click the **Export Users** button (next to Add User)
2. **Behind the Scenes:**
   - GET request to `/PortalUser/ExportUsers` endpoint
   - Server generates Excel file with all users
   - File downloads automatically

3. **Download Location:** Browser's default download folder
4. **Filename:** `users_export_YYYY-MM-DD.xlsx`

**Expected Outcome:**
- ✅ Excel file downloads with all user data
- File contains columns: Business Unit, Name, Email Address, SOL ID, Role, Status

**Testing:**
- Open the downloaded Excel file
- Verify all users are present
- Check data integrity (no missing columns)

---

## 📤 3. Bulk Upload

### 3.1 Bulk Upload Page

**URL:** `http://localhost:5173/bulk-upload`

**Navigation:**
- Click **Bulk Upload** in the sidebar

**Steps:**

#### Download Template
1. Click **Download Template** button
2. Excel file `user_upload_template.xlsx` downloads
3. Open the template file
4. **Template Structure:**
   - **Headers:** BusinessUnit, Name, Email Address, SOL ID, Role
   - **Row 2:** Example data (delete before uploading)

#### Prepare Your Data
1. Fill in user data row by row:
   - **BusinessUnit:** e.g., FINANCE, OPERATIONS, COMPLIANCE
   - **Name:** Full name of user
   - **Email Address:** Valid UBA email
   - **SOL ID:** Branch/location code
   - **Role:** IMTO or USERACCESS
2. Save the file (keep .xlsx format)
3. **Important:** Do NOT modify the header row

#### Upload Excel File
1. **Option A: Drag and Drop**
   - Drag your Excel file onto the upload area
   - Drop when you see the blue highlight

2. **Option B: Click to Browse**
   - Click anywhere in the upload area
   - File browser opens
   - Select your Excel file
   - Click "Open"

3. **File Validation:**
   - Only `.xlsx` files are accepted
   - `.xls` and `.csv` files will be rejected

4. **Upload Process:**
   - Progress indicator appears
   - File uploads to `/PortalUser/BulkAddUsers` endpoint
   - Form field name: `excelFile`

**Expected Outcome:**
- ✅ Success: "Bulk upload successful! X users added."
- ❌ Validation errors: "Error: [API error message]"
- ❌ Wrong format: "Please select an Excel file (.xlsx)"

**Testing Scenarios:**
- ✅ Valid Excel with 5 users → "5 users added successfully"
- ❌ Excel with duplicate emails → API returns specific error
- ❌ Excel with invalid role → API returns validation error
- ❌ Upload .csv file → "Please select an Excel file (.xlsx)"
- ❌ Upload .xls (old format) → "Please select an Excel file (.xlsx)"

---

## 🧭 4. Navigation & Session Management

### 4.1 Sidebar Navigation

**Components:**
- **UBA Logo** (top)
- **Navigation Items:**
  - 👥 Users
  - ☁️ Bulk Upload
- **User Profile Section** (bottom):
  - Avatar with initials
  - Display name (parsed from email)
  - Email address
  - 🚪 Logout button

**Collapse Sidebar:**
- Click the collapse icon (◀) to minimize sidebar
- Click expand icon (▶) to restore
- Persists across page navigation

**Mobile View:**
- Hamburger menu icon appears
- Sidebar slides in/out
- Overlay closes sidebar when clicked

### 4.2 Logout

**Steps:**
1. Click the **Logout** button at the bottom of sidebar
2. Confirmation dialog appears:
   - Title: "Logout"
   - Message: "Are you sure you want to logout?"
   - Buttons: "Logout" (red) | "Cancel"

3. Click **Logout** to confirm
4. **Behind the Scenes:**
   - POST request to `/Auth/logout`
   - All localStorage data is cleared:
     - Access token
     - Refresh token
     - User information
     - Temporary token
   - Redirect to login page

**Expected Outcome:**
- ✅ "Logged out successfully" → Return to login page
- All authentication data cleared from browser

---

## 🔄 5. Automatic Token Refresh

**How it Works:**
- The application uses Axios interceptors to handle authentication
- When any API call returns a **401 Unauthorized** error:
  1. Request is automatically retried with refresh token
  2. New access token is obtained from `/Auth/refresh-token`
  3. Original request is resent with new access token
  4. User continues working without interruption

**When Token Refresh Fails:**
- All tokens are cleared
- User is redirected to login page
- Message: Session expired

**Testing:**
- Leave the application open for the token expiration period
- Perform an action (e.g., search users)
- Token should refresh automatically in the background

---

## 🎨 6. User Interface Features

### 6.1 Color Scheme & Branding
- **Primary Color:** UBA Red (#D71920)
- **UBA Logo:** Displayed on login, 2FA, and sidebar
- **Dark Mode:** Supported automatically based on system preference

### 6.2 Notifications
- **Success:** Green toast notification (top-right)
- **Error:** Red SweetAlert2 modal with error details
- **Warning:** Yellow toast for validation warnings
- **Info:** Blue toast for informational messages

### 6.3 Loading States
- **Buttons:** Show "Loading..." or spinner during operations
- **Tables:** Skeleton loaders during data fetch
- **Forms:** Disabled inputs during submission

### 6.4 Accessibility
- All form inputs have proper labels
- Keyboard navigation supported
- Focus indicators visible
- ARIA attributes for screen readers

---

## 🧪 7. Complete Testing Checklist

### Authentication Testing
- [ ] Login with valid credentials
- [ ] Login with invalid email
- [ ] Login with invalid password
- [ ] Login with empty fields
- [ ] 2FA with valid code
- [ ] 2FA with invalid code
- [ ] 2FA with expired code
- [ ] Click "Back to Login" on 2FA page
- [ ] Logout successfully

### User Management Testing
- [ ] View all users (pagination works)
- [ ] Search by email
- [ ] Search by name
- [ ] Search by business unit
- [ ] Search by SOL ID
- [ ] Filter by role
- [ ] Filter by business unit
- [ ] Filter by status
- [ ] Combine search + filters
- [ ] Add new user successfully
- [ ] Add user with duplicate email (error)
- [ ] Add user with invalid email (validation)
- [ ] Cancel add user modal
- [ ] Export users to Excel
- [ ] Verify Excel export contains all data

### Bulk Upload Testing
- [ ] Download template
- [ ] Upload valid Excel file
- [ ] Upload file with 1 user
- [ ] Upload file with 10 users
- [ ] Upload file with duplicate emails
- [ ] Upload .csv file (should reject)
- [ ] Upload .xls file (should reject)
- [ ] Drag and drop Excel file
- [ ] Click to browse and select file

### Navigation Testing
- [ ] Navigate from Users to Bulk Upload
- [ ] Navigate from Bulk Upload to Users
- [ ] Collapse sidebar
- [ ] Expand sidebar
- [ ] Check mobile responsive view
- [ ] Verify user avatar displays initials
- [ ] Verify email displays in sidebar

### Session Management Testing
- [ ] Token refresh on API 401 error
- [ ] Session timeout after long inactivity
- [ ] Logout confirmation dialog
- [ ] Data cleared after logout
- [ ] Cannot access protected routes without auth

---

## 🐛 8. Common Issues & Solutions

### Issue: "Invalid email or password" on correct credentials
**Solution:** Check that API base URL in `.env` is correct and server is running

### Issue: 2FA code not working
**Solution:** 
- Ensure authenticator app is synced
- Check if code has expired (codes refresh every 30 seconds)
- Verify temporary token was properly stored from login

### Issue: "No users found" on Users page
**Solution:** 
- Check network tab for API errors
- Verify access token is valid
- Ensure backend has user data

### Issue: Excel upload fails
**Solution:**
- Verify file is .xlsx format (not .xls or .csv)
- Check that headers match exactly: BusinessUnit, Name, Email Address, SOL ID, Role
- Ensure no empty rows or invalid data

### Issue: "Session expired" message appears frequently
**Solution:** 
- Token expiration time may be too short
- Check refresh token implementation
- Verify backend token configuration

---

## 📞 9. Support Information

**For Technical Issues:**
- Email: support@ubagroup.com
- Include: Screenshot, browser version, steps to reproduce

**For User Access Issues:**
- Contact your administrator
- Provide: Your email, business unit, desired role

---

## 🔒 10. Security Best Practices

### For Users:
- ✅ Never share your 2FA codes
- ✅ Always logout when finished
- ✅ Use strong, unique passwords
- ✅ Don't save passwords in browser
- ✅ Verify you're on the correct URL before logging in

### For Administrators:
- ✅ Regularly review user access
- ✅ Remove inactive users promptly
- ✅ Monitor bulk upload activities
- ✅ Keep encryption keys secure
- ✅ Enable HTTPS in production

---

## 📊 11. Application Architecture Summary

### Frontend Stack:
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS v4
- **State Management:** TanStack Query + Zustand
- **Routing:** React Router v7

### Security Implementation:
- **Encryption:** AES-256-CBC using crypto-js
- **Authentication:** JWT with automatic refresh
- **API Key:** X-API-Key header for encryption config endpoint

### API Endpoints Summary:
1. `GET /Auth/non-fetch` - Fetch encryption configuration
2. `POST /Auth/AddtionalEncryptedLogin` - Encrypted login
3. `POST /Auth/EncryptedVerify2FA` - Encrypted 2FA verification
4. `POST /Auth/logout` - User logout
5. `GET /PortalUser/GetUsers` - Fetch all users
6. `POST /PortalUser/AddUser` - Create new user
7. `POST /PortalUser/BulkAddUsers` - Bulk upload via Excel
8. `GET /PortalUser/ExportUsers` - Export users to Excel

---

**Document Version:** 1.0  
**Last Updated:** January 28, 2026  
**Built for:** United Bank for Africa (UBA) - Actimize AML Platform
