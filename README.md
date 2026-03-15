# Nano Game Store

Nano Game Store is a full-stack web application designed for browsing, managing, and purchasing video games. The platform features separate interfaces for customers and administrators, with a robust backend powered by Node.js and MySQL.

## Features

### 🎮 Customer Features
- **Browse Games**: View a catalog of available games with details like genre, platform, and price.
- **Shopping Cart**: Add games to the cart, review the cart, and proceed to checkout.
- **Order Tracking**: View order history and track the status of current orders.
- **Authentication**: Register and log in using an email and password.

### 🛠️ Admin Features
- **Inventory Management**: Add new games, update existing game details, and delete games from the catalog.
- **Order Management**: View all customer orders and update their fulfillment status (Processing, Shipped, Delivered).
- **Secure Access**: Admin-only dashboard ensuring restricted access to management tools.

## Tech Stack

### Frontend
- **HTML5 & CSS3**
- **JavaScript (ES6+)**
- **Tailwind CSS** (via CDN) for responsive and modern UI styling.

### Backend
- **Node.js**: The Javascript runtime.
- **Express.js**: Backend web framework for handling RESTful API routes.
- **MySQL**: Relational database for storing user, game, order, and cart data.
- **bcryptjs**: Password hashing for secure user authentication.

## Working Mechanism

1. **Client-Server Architecture**: The frontend (HTML/JS) communicates with the backend (Express API) via asynchronous `fetch` requests.
2. **Database Integration**: The backend uses the `mysql2` package to interact with a MySQL database (`rana_game_store`). It utilizes standard tables alongside SQL triggers (for auto-updating inventory on purchases) and stored procedures (for transactional checkout processing).
3. **Authentication**: Users are tracked via local state on the frontend based on successful login responses from the backend API.
4. **Dynamic UI**: Navigation and available features dynamically update based on whether a user is logged in as a `CUSTOMER` or an `ADMIN`.

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) running locally.

### 1. Database Configuration
1. Ensure your local MySQL server is running.
2. The backend is configured to automatically connect to MySQL and initialize the required database (`rana_game_store`) and tables upon startup.
3. *Note: If your MySQL server requires a specific username or password, you may need to update the connection credentials in `game-store-backend/src/db/init.js` (or via environment variables if configured).*

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd game-store-backend
   ```
2. Install the required Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   npm start
   ```
   *The server will run on `http://localhost:3000` by default. You should see a message indicating connection to the MySQL database.*

### 3. Frontend Setup
1. The frontend consists of static files. You can open `game-store-frontend/index.html` directly in your web browser.
2. Alternatively, for a better development experience, you can serve the frontend directory using a local web server (e.g., VS Code Live Server, or `npx serve`):
   ```bash
   cd game-store-frontend
   npx serve
   ```

## API Endpoints Overview
- `/api/auth/register` & `/api/auth/login`: User authentication.
- `/api/games`: GET, POST, PUT, DELETE operations for game catalog.
- `/api/cart`: GET, POST, DELETE operations for shopping cart.
- `/api/orders`: GET and POST operations for customer orders, plus admin status updates.
