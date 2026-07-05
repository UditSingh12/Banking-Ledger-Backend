# Backend Ledger

A simple Node.js + Express + MongoDB backend for authentication and email registration flows.

## Features
- User registration and login
- JWT-based authentication
- Cookie-based auth token storage
- Registration email sending via Nodemailer
- MongoDB connection setup

## Tech Stack
- Node.js
- Express
- MongoDB + Mongoose
- JWT
- Nodemailer
- dotenv

## Prerequisites
Before running the project, make sure you have:
- Node.js installed
- MongoDB running locally or a MongoDB Atlas connection string
- A Google account for Gmail SMTP/OAuth2 email sending

## Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```
   On Linux/macOS:
   ```bash
   cp .env.example .env
   ```
4. Update the values in `.env`.

## Environment Variables
The app uses these variables:

- `PORT` – server port (default: 3000)
- `MONGO_URI` – MongoDB connection string
- `JWT_SECRET` – secret used to sign JWT tokens
- `EMAIL_USER` – Gmail address used for sending emails
- `CLIENT_ID` – Google OAuth2 client ID
- `CLIENT_SECRET` – Google OAuth2 client secret
- `REFRESH_TOKEN` – Google OAuth2 refresh token

## MongoDB Setup
You can use either:
- Local MongoDB:
  ```env
  MONGO_URI=mongodb://127.0.0.1:27017/backend-ledger
  ```
- MongoDB Atlas:
  ```env
  MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/backend-ledger
  ```

## Email Setup
The project uses Gmail with OAuth2.

To configure email sending:
1. Create a Google Cloud project
2. Enable Gmail API
3. Create OAuth2 credentials
4. Generate a refresh token
5. Put the values in `.env`

## Run the Project
Start the development server:
```bash
npm run dev
```

Or start normally:
```bash
npm start
```

## API Endpoints
### Auth Routes
- `POST /api/auth/register`
- `POST /api/auth/login`

## Notes
- Do not commit your real `.env` file to GitHub.
- Keep `.env` private and secure.
