# Bill Splitter Backend

This is the backend API for the Bill Splitter application.

## Deployment to Render

### Environment Variables

Make sure to set these environment variables in your Render dashboard:

- `NODE_ENV`: Set to `production`
- `PORT`: Render assigns a port automatically via the `PORT` environment variable
- `FRONTEND_URL`: Set to your frontend URL (e.g., `https://bill-splitter-frontend.onrender.com`)
- `MONGODB_URI`: Your MongoDB connection string
- `EMAIL_USER`: Your email service username
- `EMAIL_PASS`: Your email service password
- `EMAIL_FROM_NAME`: Display name for emails

### CORS Configuration

- The application is configured to allow CORS requests from all origins in production mode.
- If you need to restrict origins, modify the CORS configuration in `server.js`.

### Build Commands

Use the following settings in Render:

- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### Health Check

The API has a health check endpoint at the root URL (`/`) that returns a 200 status with basic API information.

## Local Development

1. Clone the repository
2. Run `npm install`
3. Create a `.env` file with the required environment variables (see above)
4. Run `npm run dev` to start the development server

## API Endpoints

- **Groups**: `/api/groups`
- **Expenses**: `/api/expenses`
- **Settlements**: `/api/settlements`

## Troubleshooting

### CORS Issues

If you encounter CORS issues:

1. Check the server logs for detailed CORS error information
2. Verify that your frontend URL is correctly set in the environment variables
3. In development, make sure your frontend origin is in the allowed list 