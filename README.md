# Bill Splitter

A full-stack web application for splitting bills and expenses among groups of people. Perfect for roommates, trips, and events!

## Features

- Create and manage expense groups
- Add, edit, and delete expenses
- Split expenses equally or unevenly among group members
- Track balances and view who owes whom
- Send email notifications for payments and balance summaries
- Manage settlements and mark them as completed

## Technology Stack

- **Frontend:** React with Vite, TailwindCSS
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Email Service:** Nodemailer with Gmail or custom SMTP

## Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local or cloud instance)
- Email account for sending notifications

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/bill-splitter.git
cd bill-splitter
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bill-splitter

# Email Configuration
# For Gmail setup:
# 1. Enable 2-factor authentication in your Google account
# 2. Generate an app password: Google Account > Security > App passwords
# 3. Use that password below instead of your regular password
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME=Bill Splitter

# Optional: SMTP configuration if not using Gmail
# EMAIL_HOST=smtp.example.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_REJECT_UNAUTHORIZED=true

# For testing email functionality
TEST_EMAIL=test-recipient@example.com
```

## Running the Application

### Development Mode

```bash
# Start the backend server
cd backend
npm run server

# Start the frontend development server in a new terminal
cd frontend
npm run dev
```

### Production Mode

```bash
# Build the frontend
cd frontend
npm run build

# Start the backend server
cd backend
npm start
```

## API Endpoints

### System Routes

- `GET /api/test` - Test if the API is working
- `GET /api/test/email` - Test email functionality
- `GET /api/system/status` - Get system status

### Group Routes

- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get a specific group
- `POST /api/groups` - Create a new group
- `PUT /api/groups/:id` - Update a group
- `DELETE /api/groups/:id` - Delete a group
- `GET /api/groups/:id/balance` - Get the balance of a group
- `POST /api/groups/:id/send-summary` - Send balance summary emails

### Expense Routes

- `GET /api/expenses/:groupId` - Get all expenses for a group
- `GET /api/expenses/detail/:id` - Get a specific expense
- `POST /api/expenses` - Create a new expense
- `PUT /api/expenses/:id` - Update an expense
- `DELETE /api/expenses/:id` - Delete an expense
- `GET /api/expenses/settlements/:groupId` - Get all settlements for a group
- `PUT /api/expenses/settlements/:id/complete` - Mark a settlement as complete
- `POST /api/expenses/send-settlements/:groupId` - Send settlement notifications

## Troubleshooting

### Email Service

If you're having issues with the email service:

1. Check your email credentials in the `.env` file
2. Use the `/api/test/email` endpoint to test the email functionality
3. For Gmail, make sure you've generated an app password

### Database Connection

If the MongoDB connection fails:

1. Verify that your MongoDB URI is correct in the `.env` file
2. Ensure MongoDB is running
3. Check the `/api/system/status` endpoint for connection status

## License

MIT 