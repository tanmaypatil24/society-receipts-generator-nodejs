# Project Architecture: Society Receipts Node.js

This document provides a comprehensive overview of the architecture and technology stack for the **Society Receipts** backend application.

## 1. Core Technology Stack
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules `type: module`)
- **Web Framework**: [Express.js](https://expressjs.com/) (v5.1.0)
- **Database**: [MySQL](https://www.mysql.com/) (via `mysql2`)
- **PDF Generation**: 
  - [Puppeteer](https://pptr.dev/): Used for rendering high-fidelity HTML templates to PDF.
  - [PDFKit](https://pdfkit.org/): Likely used for direct PDF manipulation or legacy generation.
- **Data Processing**: [XLSX](https://www.npmjs.com/package/xlsx) (for Excel import/export).
- **Environment Management**: `dotenv`.

---

## 2. Directory Structure
The project follows a modular and layered architecture to separate concerns.

```text
society-receipts-nodejs/
├── src/
│   ├── config/             # Configuration files (DB connection)
│   ├── controllers/        # Request handlers (API logic)
│   ├── routes/             # API endpoint definitions
│   ├── services/           # Business logic & DB interactions
│   │   └── html/           # HTML templates for PDF rendering
│   ├── utils/              # Helper functions & utilities
│   └── app.js              # Express application setup
├── receipts_templates/     # Static or external templates
├── server.js               # Entry point (Server listener)
└── .env                    # Environment variables (DB credentials, etc.)
```

---

## 3. Layered Architecture (Service-Controller-Route)

### A. Routes Layer (`src/routes/`)
Maps HTTP methods and URIs to specific controller methods.
- `member.routes.js`: Endpoints for society member data.
- `receipt.routes.js`: Endpoints for financial receipts.
- `pdf.routes.js`: Endpoints for triggering PDF generation.

### B. Controllers Layer (`src/controllers/`)
Acts as a bridge between the HTTP request and the business logic.
- Validates input (`req.body`, `req.params`).
- Calls the appropriate Service method.
- Returns formatted JSON responses or file streams.

### C. Services Layer (`src/services/`)
Contains the "heavy lifting" and business rules.
- **DB Interaction**: Performs SQL queries via `src/config/db.js`.
- **PDF Logic**: `pdf.service.js` manages the complexity of Puppeteer (launching browser, setting viewport, printing to PDF).
- **Receipt Logic**: Handles calculations or complex database transactions for billing.

### D. Configuration Layer (`src/config/`)
- `db.js`: Manages the MySQL connection pool, ensuring efficient database access.

---

## 4. Key Data Flow
1. **Request**: Client sends a request (e.g., `GET /api/receipts/1/pdf`).
2. **Routing**: `app.js` forwards the request to `pdf.routes.js`.
3. **Controller**: `pdf.controller.js` extracts the receipt ID and calls `pdfService.generateReceiptPDF(id)`.
4. **Service**: `pdf.service.js` fetches data from the database, loads an HTML template from `src/services/html/`, and uses Puppeteer to convert it to a PDF.
5. **Response**: The PDF buffer is sent back to the controller, which streams it to the client.

---

## 5. Summary of Modules
| Module | Responsibility |
| :--- | :--- |
| **Members** | Managing owner details, unit numbers, and contact info. |
| **Receipts** | Recording payments, maintenance charges, and billing cycles. |
| **PDF** | High-quality document generation for printing/emailing receipts. |
| **Converters** | Utilities for Excel/JSON data transformations. |
