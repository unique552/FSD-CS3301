# Campus Connect Portal

## Run the application

1. Install the backend and frontend dependencies:

   ```sh
   npm install --prefix server
   npm install --prefix client
   ```

2. Start a local MongoDB server, or create a MongoDB Atlas cluster.
3. Copy `server/.env.example` to `server/.env`. Replace the `MONGO_URI` placeholders with your local MongoDB or Atlas connection string. For local MongoDB, use `mongodb://127.0.0.1:27017/campus_connect`. Generate a unique `JWT_SECRET` of at least 32 characters (for example, `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`). Keep `server/.env` private; it is ignored by Git.
4. Start the API and frontend in separate terminals:

   ```sh
   npm --prefix server run dev
   npm --prefix client run dev
   ```

Run the backend authentication regression tests with `npm test --prefix server`. They stub the Mongoose models and do not write to the configured database.

The API waits for MongoDB to connect before accepting requests. It stores tasks in the `tasks` collection, assignments in the `assignments` collection, and accounts in the `users` collection in the `campus_connect` database. Existing task and assignment URLs remain in place and now require an authenticated session. Student task records are scoped to their owner; older task records without an owner remain in MongoDB but are not exposed to users.

Authentication endpoints are `POST /api/auth/register` (student accounts only), `POST /api/auth/login` (email or student ID), `POST /api/auth/logout`, and `GET /api/auth/me`. Sessions use an HTTP-only cookie; credentials are never stored in browser local storage. Registration requires a full name, university email, unique student ID, password, department, course/program, academic year, and phone number. Passwords are hashed with bcrypt. Password reset is not available until an email delivery service is configured.

The existing assignment endpoints are `GET /api/assignments`, `POST /api/assignments`, `PUT /api/assignments/:id` (update subject, title, or status), `DELETE /api/assignments/:id`, and `PUT /api/assignments/:id/submit` (mark an assignment submitted). Students can list and submit assignments; faculty and administrators can create, edit, and delete them. These existing records and endpoint paths are preserved.

Provision an administrator from the server directory with `npm run create-admin`. The script prompts for the name and email and reads the password without echoing it; public registration cannot create administrator or faculty accounts. Keep the `.env` file private. For a frontend hosted on a different site, set `COOKIE_SAME_SITE=none` and serve the API over HTTPS; the cookie will then be marked secure. The current authentication phase does not yet include administrator/faculty management screens or student/administrator dashboards.

To seed a sample assignment with `mongosh`:

```js
use campus_connect
db.assignments.insertOne({
  subject: "CS3301 - Full Stack",
  title: "Lab 2: React Routing",
  status: "Pending"
})
```

The React assignment board loads assignments from the API and exposes actions based on the authenticated role. For a separately hosted frontend, set `VITE_API_URL` to the backend base URL when building the client and set `CLIENT_ORIGIN` on the backend to the frontend's origin. For Render, add `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, and optionally `PORT` as backend environment variables; use `npm start` as the start command from the `server` directory. Add the required network access for the backend in Atlas, and avoid exposing database credentials in frontend variables.

## Implementation plan

1. Analyze the existing React pages, Express API, MongoDB models, and current task/assignment CRUD (completed).
2. Add registration, login, logout, session restoration, protected APIs, role checks, and administrator provisioning (completed).
3. Build real student and administrator dashboards backed by their respective API data.
4. Implement academics, assignments/submissions, attendance, and announcements.
5. Add examinations/results, events, library, and student services.
6. Complete API integration and database models, then refine responsive design, security, and performance.
7. Test the end-to-end flows and MongoDB persistence.