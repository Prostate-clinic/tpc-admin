# IMO Robotics Center — Backend API

**Base URL:** `http://localhost:4000/api`

**Authentication:** JWT Bearer token in the `Authorization` header.

```
Authorization: Bearer <token>
```

All endpoints require authentication **unless** marked with 🔓 (public). Role‑restricted endpoints are labelled `[ADMIN]`, `[FRONTDESK]`, `[DOCTOR]`.

> **CORS:** The API allows requests from `http://localhost:3000` (robotics‑center) and `http://localhost:4001` (admin). Credentials (`cookies`) are forwarded.

---

## Auth

### 🔓 `POST /auth/login`

Authenticate an admin/frontdesk/doctor user and receive a JWT.

**Body:**

```json
{
  "email": "admin@imo.com",
  "password": "secret123"
}
```

**Response `200`:**

```json
{
  "access_token": "eyJhbGciOiJI...",
  "user": {
    "id": "clx...",
    "name": "Admin User",
    "email": "admin@imo.com",
    "role": "ADMIN",
    "doctorId": null,
    "isFirstLogin": false
  }
}
```

---

### `GET /auth/me`

Return the currently authenticated user's profile.

**Response `200`:**

```json
{
  "id": "clx...",
  "name": "Admin User",
  "email": "admin@imo.com",
  "role": "ADMIN",
  "doctorId": null,
  "isFirstLogin": false
}
```

---

### `POST /auth/change-password` `[DOCTOR]`

Change password for the authenticated doctor. This is required for first-login accounts.

**Body:**

```json
{
  "currentPassword": "TempPass123!",
  "newPassword": "MyNewStrongPass123!"
}
```

**Response `200`:**

```json
{
  "message": "Password changed successfully"
}
```

**First-login enforcement:**
- If a doctor account has `isFirstLogin = true`, access to protected routes is restricted.
- Allowed routes until password is changed:
  - `GET /auth/me`
  - `POST /auth/change-password`
- After successful password change, `isFirstLogin` is set to `false` and normal access resumes.

---

## Users `[ADMIN]`

### `GET /users`

List all system users.

**Response `200`:**

```json
{
  "users": [
    {
      "id": "clx...",
      "name": "Admin User",
      "email": "admin@imo.com",
      "role": "ADMIN",
      "createdAt": "2026-06-01T12:00:00.000Z"
    }
  ]
}
```

---

## Doctors

### 🔓 `GET /doctors`

List all **active** doctors with their available slots.

**Response `200`:**

```json
{
  "doctors": [
    {
      "id": "clx...",
      "name": "Dr. Temitope Adeyemi",
      "specialty": "Robotic Surgery",
      "bio": "Experienced in ...",
      "image": "/images/doctor.jpg",
      "userId": null,
      "user": null,
      "slots": [
        {
          "id": "clx...",
          "date": "2026-06-15",
          "startTime": "09:00",
          "endTime": "10:00",
          "isBooked": false,
          "doctorId": "clx...",
          "createdAt": "2026-06-01T12:00:00.000Z"
        }
      ]
    }
  ]
}
```

> `slots` only includes unbooked slots with a `date >= today`, ordered by date ascending.

---

### 🔓 `GET /doctors/:id`

Get a single **active** doctor (includes all future slots, not just available ones).

---

### `POST /doctors` `[ADMIN, FRONTDESK]`

Create a new doctor.

**Body:**

```json
{
  "name": "Dr. New Doctor",
  "specialty": "Cardiology",
  "bio": "Optional bio text",
  "image": "/images/new-doc.jpg"
}
```

---

### `POST /doctors/me/display-picture` `[DOCTOR]`

Update the authenticated doctor's display picture.

**Headers:**

```http
Authorization: Bearer <doctor_token>
Content-Type: multipart/form-data
```

**Form Data:**

| Field          | Type   | Required | Description                       |
|----------------|--------|----------|-----------------------------------|
| `profileImage` | file   | ✅       | Doctor display picture image file |

**Notes:**
- Only image files are accepted
- Image is uploaded to Cloudinary and stored on the doctor `image` field

---

## Blogs

Create/update/delete blog endpoints require an authenticated `ADMIN` or `DOCTOR` token.
Read endpoints (`GET /blogs`, `GET /blogs/:id`) are public.

### `POST /blogs` `[ADMIN, DOCTOR]`

Create a new blog post using a standard blog payload.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**

```json
{
  "title": "Advances in Robotic Urology in 2026",
  "excerpt": "Key improvements in precision, recovery time, and outcomes.",
  "content": "Long-form markdown/html/plain content goes here...",
  "coverImage": "https://res.cloudinary.com/demo/image/upload/blogs/urology-2026.jpg",
  "tags": ["urology", "robotics", "surgery"],
  "status": "DRAFT"
}
```

**Notes:**
- `slug` is generated automatically from `title`.
- `status` defaults to `DRAFT`.
- Doctors can only create blogs as `DRAFT`.
- `coverImage` can be sent as either:
  - file upload field (`multipart/form-data`), or
  - plain URL string.
- `tags` supports:
  - repeated fields (`tags=urology`, `tags=robotics`),
  - comma-separated string (`urology,robotics`),
  - JSON array string (`["urology","robotics"]`).

---

### 🔓 `GET /blogs`

View blog posts.

**Notes:**
- Public users see only `PUBLISHED` blogs.
- Authenticated `ADMIN` and `DOCTOR` users can also see `DRAFT` blogs.

**Query params:**

| Param   | Type     | Required | Description |
|---------|----------|----------|-------------|
| `page`  | `number` | No       | Page number (default: `1`) |
| `limit` | `number` | No       | Page size (default: `20`, max: `100`) |

**Response `200`:**

```json
{
  "blogs": [
    {
      "id": "clx...",
      "title": "Advances in Robotic Urology in 2026",
      "slug": "advances-in-robotic-urology-in-2026",
      "status": "PUBLISHED"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

---

### `GET /blogs/me` `[ADMIN, DOCTOR]`

View blog posts created by the authenticated user.

---

### 🔓 `GET /blogs/:id`

Get a single blog post by ID.

**Notes:**
- Public endpoint (no authentication required).
- Public users can fetch only `PUBLISHED` blogs.
- Authenticated `ADMIN` and `DOCTOR` users can fetch both `PUBLISHED` and `DRAFT` blogs.

**Response `404`:**
- Blog does not exist, or blog is `DRAFT` and request is unauthenticated.

**Response `200`:**

```json
{
  "blog": {
    "id": "clx...",
    "title": "Advances in Robotic Urology in 2026",
    "slug": "advances-in-robotic-urology-in-2026",
    "excerpt": "Key improvements in precision, recovery time, and outcomes.",
    "content": "Long-form content...",
    "coverImage": "https://res.cloudinary.com/demo/image/upload/blogs/urology-2026.jpg",
    "tags": ["urology", "robotics"],
    "status": "DRAFT",
    "authorId": "clx...",
    "createdAt": "2026-06-04T10:00:00.000Z",
    "updatedAt": "2026-06-04T10:00:00.000Z",
    "author": {
      "id": "clx...",
      "name": "Dr. Jane Doe",
      "email": "doctor@clinic.com",
      "role": "DOCTOR"
    }
  }
}
```

---

### `DELETE /blogs/:id` `[ADMIN, DOCTOR]`

Delete a blog post.

**Rules:**
- Admin can delete any blog.
- Doctor can delete only blogs they created.

---

### `PATCH /blogs/:id/status` `[ADMIN, DOCTOR]`

Update blog status.

**Body:**

```json
{
  "status": "PUBLISHED"
}
```

**Rules:**
- Admin can set status freely (`DRAFT` or `PUBLISHED`).
- Doctor can only change their own blog from `DRAFT` to `PUBLISHED`.

---

### `PATCH /blogs/:id/toggle-status` `[ADMIN]`

Admin-only convenience endpoint to toggle a post between `DRAFT` and `PUBLISHED`.

---

## Services

### 🔓 `GET /services`

List all medical services.

**Response `200`:**

```json
{
  "services": [
    {
      "id": "clx...",
      "name": "Prostatectomy",
      "category": "SURGICAL",
      "duration": 120,
      "price": "5000.00",
      "description": "Robotic-assisted ...",
      "focus": ["Prostate", "Cancer"],
      "createdAt": "2026-06-01T12:00:00.000Z"
    }
  ]
}
```

**`category` enum:** `SURGICAL | CONSULTATION | DIAGNOSTICS | IMAGING`

---

### 🔓 `GET /services/:id`

Get a single service.

---

### `POST /services` `[ADMIN, FRONTDESK]`

Create a new service.

**Body:**

```json
{
  "name": "New Service",
  "category": "CONSULTATION",
  "duration": 60,
  "price": 250.00,
  "description": "Optional description",
  "focus": ["General"]
}
```

---

## Slots

### 🔓 `GET /slots`

Get available (unbooked) appointment slots.

**Query params:**

| Param      | Type     | Required | Description                           |
|------------|----------|----------|---------------------------------------|
| `doctorId` | `string` | No       | Filter by doctor ID (UUID or slug)    |

**Response `200`:**

```json
{
  "slots": [
    {
      "id": "clx...",
      "date": "2026-06-15",
      "startTime": "09:00",
      "endTime": "10:00",
      "isBooked": false,
      "doctorId": "clx...",
      "doctor": { "id": "clx...", "name": "Dr. Temitope Adeyemi" },
      "createdAt": "2026-06-01T12:00:00.000Z"
    }
  ]
}
```

---

### `POST /slots` `[ADMIN, DOCTOR]`

Create a new appointment slot.

**Body:**

```json
{
  "date": "2026-06-20",
  "startTime": "14:00",
  "endTime": "15:00",
  "doctorId": "clx..."
}
```

> If `doctorId` is omitted and the authenticated user is a `DOCTOR`, the slot is created for that doctor automatically.

**Validation & guardrails:**
- Rejects past dates (`400`)
- Rejects invalid ranges where `endTime <= startTime` (`400`)
- Enforces minimum duration of `15` minutes (`400`)
- Enforces clinic hours `08:00-18:00` (`400`)
- Rejects overlapping slots for same doctor/date (`409`, code `SLOT_CONFLICT`)
- Overlap checks are concurrency-safe (transaction lock per doctor/date)

---

### `POST /slots/bulk` `[ADMIN, DOCTOR]`

Generate multiple slots in one request using a time window.

**Body:**

```json
{
  "date": "2026-06-20",
  "windowStart": "08:00",
  "windowEnd": "12:00",
  "durationMinutes": 30,
  "breakMinutes": 10,
  "doctorId": "clx..."
}
```

**Response `201`:**

```json
{
  "count": 6,
  "message": "Slots generated successfully",
  "slots": [
    {
      "id": "clx...",
      "date": "2026-06-20",
      "startTime": "08:00",
      "endTime": "08:30",
      "isBooked": false,
      "doctorId": "clx..."
    }
  ]
}
```

---

## Appointments

### `POST /appointments` `[PATIENT AUTH REQUIRED]`

Book a new appointment as an authenticated patient. The patient record is no longer created during booking; it must already exist via patient registration.

**Headers:**

```http
Authorization: Bearer <patient_token>
Content-Type: application/json
```

**Body:**

```json
{
  "serviceId": "clx...",
  "doctorId": "adeyemi",
  "date": "2026-06-20",
  "startTime": "09:00",
  "endTime": "10:00",
  "slotId": "clx...",
  "notes": "Optional notes"
}
```

| Field       | Required | Notes                                                       |
|-------------|----------|-------------------------------------------------------------|
| `serviceId` | ✅       | UUID of the medical service                                 |
| `doctorId`  | ✅       | UUID **or** slug (`adeyemi`, `okonkwo`, `balogun`, `olonade`, `adamu`, `emeka`) |
| `date`      | ✅       | ISO date string (`YYYY-MM-DD`)                              |
| `startTime` | ✅       | `HH:MM` format                                              |
| `endTime`   | ✅       | `HH:MM` format                                              |
| `slotId`    | ❌       | UUID of a specific slot to lock                             |
| `notes`     | ❌       |                                                             |

**Booking behavior:**
- If `slotId` is provided, it must match the same `doctorId`, `date`, `startTime`, and `endTime`
- Slot lock (`isBooked=true`) and appointment creation happen atomically in one transaction
- If slot is already booked, returns `409` with code `SLOT_ALREADY_BOOKED`
- If provided slot does not match requested tuple, returns `409` with code `SLOT_MISMATCH`
- Booking for deleted doctors is blocked (`409`)

**Response `201`:**

```json
{
  "patientId": "clx...",
  "appointment": {
    "id": "clx...",
    "date": "2026-06-20",
    "startTime": "09:00",
    "endTime": "10:00",
    "status": "BOOKED",
    "notes": null,
    "patientId": "clx...",
    "doctorId": "clx...",
    "serviceId": "clx...",
    "slotId": "clx...",
    "createdAt": "...",
    "updatedAt": "...",
    "patient": { "id": "clx...", "name": "John Doe", "email": "john@example.com", "phone": "+2348012345678", "emailVerified": true },
    "doctor": { "id": "clx...", "name": "Dr. Temitope Adeyemi", ... },
    "service": { "id": "clx...", "name": "Prostatectomy", ... },
    "payment": { "id": "clx...", "amount": "5000.00", "status": "COMPLETED", ... }
  }
}
```

---

### `GET /appointments` `[ADMIN, FRONTDESK]`

List all appointments.

**Query params:**

| Param    | Type     | Required | Description                                    |
|----------|----------|----------|------------------------------------------------|
| `status` | `string` | No       | Filter by status: `BOOKED`, `CLOSED`, `CANCELLED` |

**Response `200`:**

```json
{
  "appointments": [
    {
      "id": "clx...",
      "date": "2026-06-20",
      "startTime": "09:00",
      "endTime": "10:00",
      "status": "BOOKED",
      "notes": null,
      "patientId": "clx...",
      "doctorId": "clx...",
      "serviceId": "clx...",
      "slotId": "clx...",
      "createdAt": "...",
      "updatedAt": "...",
      "patient": { ... },
      "doctor": { ... },
      "service": { ... },
      "payment": { ... }
    }
  ]
}
```

---

### `GET /appointments/:id` `[ADMIN, FRONTDESK, DOCTOR]`

Get a single appointment with all relations.

---

### `PATCH /appointments/:id` `[ADMIN, FRONTDESK, DOCTOR]`

Update an appointment's status or notes.

**Body:**

```json
{
  "status": "CLOSED",
  "notes": "Patient completed successfully"
}
```

| Field    | Required | Values                                    |
|----------|----------|-------------------------------------------|
| `status` | ❌       | `BOOKED`, `CLOSED`, `CANCELLED`           |
| `notes`  | ❌       | Free text                                 |

> **Doctors can only update their own appointments.** Admin/Frontdesk can update any.

---

## Payments

### `GET /payments` `[ADMIN, FRONTDESK]`

List all payments with nested appointment, patient, doctor, and service data.

**Response `200`:**

```json
{
  "payments": [
    {
      "id": "clx...",
      "amount": "5000.00",
      "status": "COMPLETED",
      "appointmentId": "clx...",
      "createdAt": "...",
      "appointment": {
        "id": "clx...",
        "date": "2026-06-20",
        "startTime": "09:00",
        "endTime": "10:00",
        "status": "BOOKED",
        "patient": { ... },
        "doctor": { ... },
        "service": { ... }
      }
    }
  ]
}
```

**`status` enum:** `PENDING | COMPLETED | FAILED | REFUNDED`

---

### `GET /payments/:id` `[ADMIN, FRONTDESK]`

Get a single payment with full nested data.

---

## Admin

All endpoints in this section require an authenticated `ADMIN` token.

### `GET /admin/doctors` `[ADMIN]`

List all doctors whose status is `ACTIVE`.

---

### `GET /admin/doctors/recycle-bin` `[ADMIN]`

List all doctors whose status is `DELETED`.

---

### `POST /admin/doctors` `[ADMIN]`

Add a doctor profile and optionally upload a profile image.

**Headers:**

```http
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Form Data:**

| Field          | Type   | Required | Description                             |
|----------------|--------|----------|-----------------------------------------|
| `name`         | text   | ✅       | Doctor full name                        |
| `specialty`    | text   | ✅       | Doctor specialty                        |
| `bio`          | text   | ❌       | Short profile bio                       |
| `profileImage` | file   | ❌       | Image file uploaded to Cloudinary       |
| `image`        | text   | ❌       | Optional direct image URL (no upload)   |

**Notes:**
- If `profileImage` is provided, uploaded Cloudinary URL is used
- If no file is provided, `image` (text URL) is used when present
- New doctors are created with status `ACTIVE` by default
- If `email` is provided, doctor profile + login account are created atomically in one request
- New doctor login accounts are created with `isFirstLogin = true`

---

### `POST /admin/doctors/:id/account` `[ADMIN]`

Create a login account for an existing doctor profile.

**Body:**

```json
{
  "email": "doctor@clinic.com"
}
```

**Notes:**
- Doctor must already exist in doctors table
- Doctor must not already have an account
- A random temporary password is generated and sent by email

---

### `DELETE /admin/doctors/:id` `[ADMIN]`

Soft-delete doctor profile by changing status to `DELETED`.

**Notes:**
- This endpoint does not physically remove doctor records
- Deleted doctors are available in `/admin/doctors/recycle-bin`
- Public and regular doctor listing endpoints only return `ACTIVE` doctors

---

### `PATCH /admin/doctors/:id/restore` `[ADMIN]`

Restore a soft-deleted doctor back to `ACTIVE` status.

**Response `200`:**

```json
{
  "message": "Doctor restored successfully"
}
```

---

## Patients

### 🔓 `POST /patients/register`

Register a patient account. This is where the patient record is created.

**Body:**

```json
{
  "name": "John Doe",
  "address": "12 Allen Avenue, Ikeja",
  "age": 34,
  "gender": "MALE",
  "lga": "Ikeja",
  "phone": "+2348012345678",
  "email": "john@example.com",
  "password": "mySecurePass123"
}
```

| Field      | Required | Notes |
|------------|----------|-------|
| `name`     | ✅       | Min 2 chars |
| `address`  | ✅       | Min 5 chars |
| `age`      | ✅       | Integer, minimum 1 |
| `gender`   | ✅       | String (e.g. `MALE`, `FEMALE`, `OTHER`) |
| `lga`      | ✅       | Local Government Area |
| `phone`    | ❌       | |
| `email`    | ✅       | Must be unique |
| `password` | ✅       | Min 6 chars |

**Response `201`:**

```json
{
  "message": "Registration successful. Verify your email with the OTP sent.",
  "patient": {
    "id": "clx...",
    "name": "John Doe",
    "address": "12 Allen Avenue, Ikeja",
    "age": 34,
    "gender": "MALE",
    "lga": "Ikeja",
    "email": "john@example.com",
    "phone": "+2348012345678",
    "emailVerified": false,
    "createdAt": "2026-06-03T09:00:00.000Z"
  },
  "otpExpiresAt": "2026-06-03T09:10:00.000Z"
}
```

---

### 🔓 `POST /patients/verify-email-otp`

Verify patient email address with OTP sent during registration.

**Body:**

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response `200`:**

```json
{
  "message": "Email verified successfully"
}
```

---

### 🔓 `POST /patients/login`

Login as patient after email verification.

**Body:**

```json
{
  "email": "john@example.com",
  "password": "mySecurePass123"
}
```

**Response `200`:**

```json
{
  "access_token": "eyJhbGciOiJI...",
  "patient": {
    "id": "clx...",
    "name": "John Doe",
    "address": "12 Allen Avenue, Ikeja",
    "age": 34,
    "gender": "MALE",
    "lga": "Ikeja",
    "email": "john@example.com",
    "phone": "+2348012345678",
    "emailVerified": true
  }
}
```

---

### `GET /patients/me` `[PATIENT AUTH REQUIRED]`

Get the authenticated patient's profile.

---

### `GET /patients/me/appointments` `[PATIENT AUTH REQUIRED]`

Get authenticated patient's appointment history.

---

### `GET /patients` `[ADMIN, FRONTDESK]`

List all patients.

---

### `GET /patients/:id` `[ADMIN, FRONTDESK]`

Get a single patient with all their appointments (including doctor, service, payment).

---

### 🔓 `POST /patients/history`

Get patient profile and full appointment history using `patientId` and patient-created password.

**Body:**

```json
{
  "patientId": "clx...",
  "password": "mySecurePass123"
}
```

**Response errors:**

- `404` if `patientId` does not exist.
- `401` if password is invalid.

---

## Data Model (Enums)

| Enum                 | Values                                            |
|----------------------|---------------------------------------------------|
| `Role`               | `ADMIN`, `DOCTOR`, `FRONTDESK`                    |
| `BlogStatus`         | `DRAFT`, `PUBLISHED`                              |
| `ServiceCategory`    | `SURGICAL`, `CONSULTATION`, `DIAGNOSTICS`, `IMAGING` |
| `AppointmentStatus`  | `BOOKED`, `CLOSED`, `CANCELLED`                   |
| `PaymentStatus`      | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`      |

---

## Error Responses

All errors return a consistent JSON shape:

```json
{
  "message": "Description of what went wrong",
  "code": "OPTIONAL_STABLE_CODE",
  "error": "Not Found",
  "statusCode": 404
}
```

| Status | Meaning                    | Common causes                                    |
|--------|----------------------------|--------------------------------------------------|
| 400    | Bad Request                | Missing/invalid fields, slot already booked       |
| 401    | Unauthorized               | Missing/invalid/expired JWT                       |
| 403    | Forbidden                  | Authenticated but wrong role                      |
| 404    | Not Found                  | Resource doesn't exist                            |
| 500    | Internal Server Error      | Unexpected server error                           |

### Stable Error Codes

Some conflicts include a stable `code` value in the response body for deterministic client handling:

| Code                 | Typical HTTP | Meaning |
|----------------------|--------------|---------|
| `DUPLICATE_REQUEST`  | `409`        | Duplicate POST request (in-flight or recent replay) |
| `SLOT_CONFLICT`      | `409`        | Slot overlaps an existing slot |
| `SLOT_MISMATCH`      | `409`        | Provided `slotId` does not match requested doctor/date/time tuple |
| `SLOT_ALREADY_BOOKED`| `409`        | Slot was already booked by another request |

---

## Request/Response Headers

| Header            | When        | Value                          |
|-------------------|-------------|--------------------------------|
| `Authorization`   | All auth'd  | `Bearer <token>`               |
| `Content-Type`    | POST/PATCH  | `application/json`             |
| `x-idempotency-key` | POST (optional, recommended) | Any unique client-generated key (UUID) |

The API uses JSON for all request and response bodies. Dates are ISO‑8601 strings. Monetary amounts are decimal strings (e.g. `"5000.00"`).

---

## Race Condition Protection (POST)

To reduce accidental duplicate submissions (double-clicks/retries), all `POST` endpoints are protected by a race guard:

- If the same `POST` request is already in progress, a `409 Conflict` is returned.
- If the same `POST` payload is repeated immediately after completion (short window), a `409 Conflict` is returned.
- Send `x-idempotency-key` on client POST calls for safer retries from UI/mobile clients.
- Duplicate conflicts return `code: "DUPLICATE_REQUEST"` for deterministic frontend handling.
