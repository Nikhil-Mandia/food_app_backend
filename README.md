# QuickBite

Food ordering app with a React menu, a cart, checkout, live order tracking, and order history saved in the browser.

The app is split into two repositories. Run the backend first, then the frontend.

| Part | Repository | Local URL |
|---|---|---|
| Backend (API + MongoDB) | https://github.com/Nikhil-Mandia/food_app_backend | http://localhost:5000 |
| Frontend (React) | https://github.com/Nikhil-Mandia/food_app_frontend | http://localhost:5173 |

## What you need

- [Node.js](https://nodejs.org/) 20 or newer, with npm
- MongoDB running on your machine, or a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

Check Node:

```bash
node -v
npm -v
```

## 1. Backend

```bash
git clone https://github.com/Nikhil-Mandia/food_app_backend.git
cd food_app_backend
```

Create the env file.

Windows PowerShell:

```powershell
copy .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

`.env` is not committed. The example looks like this:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/food-delivery
CLIENT_ORIGIN=http://localhost:5173
STATUS_STEP_MS=8000
```

| Variable | What it does |
|---|---|
| `PORT` | API port. Default `5000`. |
| `MONGODB_URI` | MongoDB connection string. Local default uses database `food-delivery`. |
| `CLIENT_ORIGIN` | Frontend URL allowed by CORS. Keep this equal to the URL you open in the browser. |
| `STATUS_STEP_MS` | How long each order status lasts, in milliseconds. `8000` means a new status every 8 seconds. |

Install dependencies, load the menu, and start the API. Use a second terminal for the frontend and leave this one running.

```bash
npm install
npm run seed
npm run dev
```

You should see `MongoDB connected` and `API running on port 5000`.

`npm run seed` inserts the menu only when the collection is empty. To wipe the menu and insert it again:

```bash
npm run seed:force
```

### MongoDB

**Local.** Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) and make sure it is running before `npm run dev`. On Windows the MongoDB service usually starts on its own. The default URI in `.env.example` is already correct for a local server.

**Atlas.** Create a free cluster, allow your IP, and put the connection string in `MONGODB_URI`:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/food-delivery
```

Replace `USER`, `PASSWORD`, and `CLUSTER` with your own values. If the password contains `@`, `#`, or `/`, URL-encode those characters.

## 2. Frontend

Open a new terminal.

```bash
git clone https://github.com/Nikhil-Mandia/food_app_frontend.git
cd food_app_frontend
```

Create the env file.

Windows PowerShell:

```powershell
copy .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

`VITE_API_URL` must end with `/api`. The app calls `/menu` and `/orders` on the end of that value. After changing `.env`, stop Vite and start it again.

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## 3. Use the app

1. Add items from the menu. The button turns into minus, count, and plus.
2. Open checkout and enter a name, an address of at least 10 characters, and a 10-digit mobile number starting with 6–9.
3. Place the order. The tracking page opens at `/orders/<id>`.
4. The status moves on its own: **Order Received → Preparing → Out for Delivery → Delivered**. Each step waits `STATUS_STEP_MS` (8 seconds by default).
5. Cancel is available only while the status is **Order Received**.
6. **Order history** lists orders placed in this browser.

The tracking page does not poll. It opens one Server-Sent Events connection to `GET /api/orders/:id/events`. When the API changes the status, it pushes the new order down that connection. The page closes the connection after **Delivered** or **Cancelled**.

## Scripts

Backend:

| Command | What it does |
|---|---|
| `npm run dev` | Start the API with nodemon |
| `npm start` | Start the API once, without reload |
| `npm run seed` | Insert menu items if the collection is empty |
| `npm run seed:force` | Delete the menu and insert it again |
| `npm test` | API tests with Jest and an in-memory MongoDB |

Frontend:

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite at http://localhost:5173 |
| `npm run build` | Production build in `dist` |
| `npm run preview` | Serve the production build |
| `npm test` | UI tests with Vitest |

## API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/menu` | Available menu items |
| `POST` | `/api/orders` | Create an order. The server calculates the price. |
| `GET` | `/api/orders/:id` | Read one order |
| `GET` | `/api/orders/:id/events` | Live status stream (Server-Sent Events) |
| `GET` | `/api/orders?ids=a,b` | Order history for those ids |
| `PATCH` | `/api/orders/:id/status` | Move one step forward |
| `DELETE` | `/api/orders/:id` | Cancel, only while the status is `RECEIVED` |

## Pages

| URL | Screen |
|---|---|
| `/` | Menu and cart |
| `/checkout` | Delivery details |
| `/orders/:orderId` | Live tracking |
| `/history` | Orders placed in this browser |


