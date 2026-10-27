# CareDesk - Healthcare Backend

A Django + DRF backend for managing patients, doctors and the assignments between them.
Auth is JWT (simplejwt), data lives in PostgreSQL, and secrets come from a `.env` file.
There's also a small web page at `/` so you can click through everything without Postman.

## Setup

```bash
git clone <your-repo-url>
cd healthcare
python -m venv venv
venv\Scripts\activate          # on Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create the database in PostgreSQL:

```sql
CREATE DATABASE healthcare_db;
```

Copy the env file and put in your own values:

```bash
cp .env.example .env
```

Then:

```bash
python manage.py migrate
python manage.py runserver
```

Open http://127.0.0.1:8000/ for the web page. The API lives under `/api/`.

No Postgres handy? Add `USE_SQLITE=1` to `.env` for a quick local try. Use Postgres for the real submission.

## Endpoints

| Method | URL | What it does |
|---|---|---|
| POST | `/api/auth/register/` | Sign up with name, email, password |
| POST | `/api/auth/login/` | Log in, returns access + refresh tokens |
| POST | `/api/auth/token/refresh/` | Get a new access token |
| POST / GET | `/api/patients/` | Add a patient / list your patients |
| GET / PUT / DELETE | `/api/patients/<id>/` | One patient |
| POST / GET | `/api/doctors/` | Add a doctor / list all doctors |
| GET / PUT / DELETE | `/api/doctors/<id>/` | One doctor (only the creator can edit or delete) |
| POST / GET | `/api/mappings/` | Assign a doctor / list your assignments |
| GET | `/api/mappings/<patient_id>/` | Doctors assigned to one patient |
| DELETE | `/api/mappings/<id>/` | Remove an assignment |

Send the token on protected routes as `Authorization: Bearer <access_token>`.

## Quick curl test

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@example.com","password":"strongpass99"}'
```

## Decisions I made

- **Email is the username.** Django's User model wants a username, so I store the email there. That way login is just email + password.
- **Patients are private.** You only ever see patients you created. Someone else's patient id returns 404, not 403, so it doesn't leak that the record exists.
- **Doctors are shared.** The brief says "retrieve all doctors", so any logged-in user can read them, but only the user who added a doctor can edit or delete them.
- **One URL, two meanings.** `GET /api/mappings/<patient_id>/` treats the number as a patient id, while `DELETE /api/mappings/<id>/` treats it as a mapping id. That's how the brief is written, so I followed it and left a comment in the view.
- **No duplicate assignments.** The same doctor can't be linked to the same patient twice (enforced in the serializer and by a DB constraint).

## Project structure

```
healthcare_backend/
├── manage.py
├── requirements.txt
├── .env.example          copy to .env and fill in your own values
├── config/               project settings, root urls, error handler
├── accounts/             register + login (JWT)
├── records/              patients, doctors, mappings (models, serializers, views, tests)
├── templates/
│   └── index.html        the single web page
└── static/
    ├── css/style.css     all the styling (dark mode included)
    └── js/
        ├── utils.js      shared state + small helpers
        ├── api.js        fetch wrapper that attaches / refreshes the JWT
        ├── auth.js       sign in, sign up, sign out
        ├── views.js      tabs, theme and the lists on each page
        ├── drawer.js     patient side panel
        ├── actions.js    dialogs, delete confirmations, click handling
        └── main.js       runs last, restores theme and session
```

The scripts are plain files loaded in that order from `index.html`, so there is no build step.

## Tests

```bash
python manage.py test
```
