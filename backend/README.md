# Backend Ledger API Documentation

Backend Ledger is a high-precision, security-hardened double-entry banking backend built with Node.js, Express 5, and Mongoose (MongoDB).

---

## Technical Architecture & Safety Guarantees

### 1. Atomic Multi-Document Transactions
All money-moving logic (transfers, reversals, etc.) executes within a MongoDB Session transaction. This guarantees that balance updates and transaction records commit atomically—if any operation fails or throws an validation error (such as a negative balance backstop), the entire set of operations rolls back instantly.

### 2. Strict Request Validation
Input validation is handled via Zod schemas matched with an Express middleware wrapper. Unvalidated keys are stripped automatically before reaching controllers.
*   **Response format on validation failure:** `400 Bad Request`
    ```json
    {
      "message": "Validation failed",
      "errors": [
        { "field": "email", "message": "Invalid email address" }
      ],
      "status": "Failed"
    }
    ```

### 3. Idempotency Support
The `/api/transaction/transfer` endpoint accepts an `idempotencyKey` parameter. If a request fails mid-transit or is retried due to network issues, the system detects the unique key constraint violation (`code 11000`) and returns the previously processed transaction with a `200 OK` response instead of performing a double-debit.

### 4. Brute-Force & Session Security
*   **Brute-Force Lockout:** 5 failed login attempts lock the user profile for 15 minutes.
*   **Real Server-Side Logouts:** Protected routes enforce a `tokenVersion` check. When a user requests a logout or changes their password, `tokenVersion` is incremented in the database. Any existing JWTs are immediately rendered stale and rejected.

---

## Express 5 `req.query` Immutable Getter Workaround

In Express 5, `req.query` is defined as an immutable getter. Consequently, third-party middleware (like `express-mongo-sanitize`) and custom validation wrappers that attempt to mutate `req.query` directly throw a `TypeError: Cannot set property query of IncomingMessage which has only a getter`.

To support mutations safely, we register a custom middleware at the top of the middleware stack in [app.js](file:///c:/Users/Udit%20Singh/OneDrive/Desktop/Backend-Ledger/backend/src/app.js):
```javascript
app.use((req, res, next) => {
  Object.defineProperty(req, "query", {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});
```
This redefines the `query` property as a plain, writable object allowing safe mutation.

---

## Route Reference

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Middleware / Validation |
| :--- | :--- | :--- | :--- |
| **POST** | `/register` | Pre-registers unverified user, sends OTP | Rate Limiter (5/15m), Zod Schema |
| **POST** | `/verify-email` | Verifies OTP code, activates user | Zod Schema |
| **POST** | `/resend-otp` | Sends a fresh 6-digit OTP code | Zod Schema |
| **POST** | `/login` | Authenticates user, issues JWT cookie | Rate Limiter (10/15m), Lockout Check, Zod |
| **POST** | `/logout` | Invalidates current token, clears cookie | Protected (authMiddleware) |
| **POST** | `/change-password`| Changes password, invalidates all tokens | Protected (authMiddleware), Zod Schema |

### 2. Accounts (`/api/account`)

| Method | Endpoint | Description | Middleware / Validation |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Lists all accounts for authenticated user | Protected (authMiddleware) |
| **POST** | `/` | Opens a new `SAVINGS` or `CURRENT` account | Protected, Zod Schema (Conflict 409 if owned) |
| **PATCH**| `/:id/status` | Freezes or Closes account (Consequence check) | Protected, Zod Schema |
| **GET** | `/:id/transactions`| Returns filtered, paginated transaction history | Protected, Zod Query Validation |

### 3. Transactions (`/api/transaction`)

| Method | Endpoint | Description | Middleware / Validation |
| :--- | :--- | :--- | :--- |
| **POST** | `/transfer` | Initiates atomic transfer with Idempotency Key | Protected, Zod Schema |
| **POST** | `/:id/reverse`| Reverses a COMPLETED transaction | Protected, Zod Schema |
