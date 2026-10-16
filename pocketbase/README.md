# PocketBase & PocketHost Setup Guide

## 1. Import Collection Schema to PocketHost

You can import the schema directly into your PocketBase Admin UI:

1. Log in to your PocketBase Admin dashboard on PocketHost (`https://<your-app>.pockethost.io/_/`).
2. Navigate to **Settings** (gear icon) -> **Sync / Export collections**.
3. Copy the contents of [`pocketbase/pb_schema.json`](file:///home/sayoga/projects/svi-kuesioner/pocketbase/pb_schema.json) (which contains both `forms` and `responses` collections) or [`pocketbase/pb_responses_schema.json`](file:///home/sayoga/projects/svi-kuesioner/pocketbase/pb_responses_schema.json) for just the `responses` collection.
4. Paste it into **Load from JSON / Import collections** and click **Review & Confirm**.

### Collections Overview

#### A. Collection: `forms`
- **Fields**:
  - `title` (`text`, required)
  - `description` (`text`, optional)
  - `is_active` (`bool`, default: true)
  - `questions` (`json`, required)

#### B. Collection: `responses`
- **Fields**:
  - `form_id` (`relation` to `forms`, cascade on delete, required)
  - `respondent_name` (`text`, optional)
  - `answers` (`json`, required) -> `{ [q_id]: string | number | string[] }`

---

## 2. Environment Variables Configuration

Set your PocketHost URL in `.env.local`:

```env
NEXT_PUBLIC_POCKETBASE_URL="https://<your-app>.pockethost.io"
POCKETBASE_URL="https://<your-app>.pockethost.io"
```

---

## 3. API Endpoints

### Forms
- `GET /api/forms`: List all forms with filters (`?isActive=true&page=1&perPage=50&search=...`) or `?latestActive=true`.
- `POST /api/forms`: Create a new form (validated with Zod).
- `GET /api/forms/[id]`: Retrieve a specific form.
- `PATCH /api/forms/[id]`: Update form.
- `DELETE /api/forms/[id]`: Delete form.

### Responses & Submissions
- `POST /api/responses`: Submit answers from respondents.
  - Body:
    ```json
    {
      "form_id": "FORM_RECORD_ID",
      "respondent_name": "Optional Name",
      "answers": {
        "q_01": "John Doe",
        "q_02": "Engineering",
        "q_03": "Sangat Puas",
        "q_04": ["Analisis Grafik Real-time", "Filter Kategori"],
        "q_05": "Great system!"
      }
    }
    ```

### Analytics
- `GET /api/analytics/[formId]`: Aggregated chart-ready analytics data.
  - Response output:
    ```json
    {
      "data": {
        "formId": "FORM_RECORD_ID",
        "formTitle": "Survei Kepuasan",
        "totalResponses": 25,
        "summary": {
          "q_02": { "Engineering": 15, "Marketing": 10 },
          "q_03": { "Sangat Puas": 18, "Puas": 7 }
        },
        "questions": [...],
        "lastResponseAt": "2026-10-13 08:30:00.000Z"
      }
    }
    ```

---

## 4. Server Actions
- `src/actions/forms.ts`:
  - `getFormsAction`
  - `getFormByIdAction`
  - `createFormAction`
  - `updateFormAction`
  - `deleteFormAction`
  - `toggleFormStatusAction`
- `src/actions/responses.ts`:
  - `submitResponseAction`
  - `getFormAnalyticsAction`
  - `getResponsesByFormAction`
