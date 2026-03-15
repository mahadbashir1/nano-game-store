const apiBaseUrl = "http://localhost:3000/api";
let currentUser = null;
let editingGameId = null;

// Page Navigation
function showPage(pageId) {
  document
    .querySelectorAll(".page")
    .forEach((page) => page.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");
}

// Update Navigation based on user role
function updateNav() {
  const navLinks = document.getElementById("nav-links");
  if (currentUser) {
    if (currentUser.role === "ADMIN") {
      navLinks.innerHTML = `
                <a href="#admin-dashboard" class="nav-link block px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-blue-400">Dashboard</a>
                <a href="#logout" class="nav-link block px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-blue-400">Logout</a>
            `;
    } else {
      navLinks.innerHTML = `
                <a href="#home" class="nav-link block px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-blue-400">Home</a>
                <a href="#cart" class="nav-link block px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-blue-400">Cart</a>
                <a href="#orders" class="nav-link block px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-blue-400">Orders</a>
                <a href="#logout" class="nav-link block px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-blue-400">Logout</a>
            `;
    }
  } else {
    navLinks.innerHTML = `
            <a href="#home" class="nav-link block px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-blue-400">Home</a>
            <a href="#cart" class="nav-link block px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-blue-400">Cart</a>
            <a href="#orders" class="nav-link block px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-blue-400">Orders</a>
            <a href="#login" class="nav-link block px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-blue-400">Login</a>
            <a href="#register" class="nav-link block px-4 py-2 rounded-lg hover:bg-gray-700 hover:text-blue-400">Register</a>
        `;
  }
}

// Handle Navigation Clicks
document.getElementById("nav-links").addEventListener("click", (e) => {
  if (e.target.classList.contains("nav-link")) {
    e.preventDefault();
    const page = e.target.getAttribute("href").substring(1);
    if (page === "logout") {
      currentUser = null;
      editingGameId = null;
      updateNav();
      showPage("home");
      loadGames();
    } else {
      showPage(page);
      if (page === "home") loadGames();
      if (page === "cart") loadCart();
      if (page === "orders") loadOrders();
      if (page === "admin-dashboard") loadAdminDashboard();
    }
  }
});

// Load Games
async function loadGames() {
  const response = await fetch(`${apiBaseUrl}/games`);
  const games = await response.json();
  const gamesList = document.getElementById("games-list");
  gamesList.innerHTML = games
    .map(
      (game) => `
        <div class="card bg-gray-800 p-6 rounded-xl shadow-lg">
            <div class="h-40 bg-gray-700 rounded-lg mb-4"></div>
            <h3 class="text-xl font-bold text-blue-400">${game.title}</h3>
            <p class="text-gray-400">${game.genre} - ${game.platform}</p>
            <p class="text-lg font-bold text-blue-400">$${game.price}</p>
            <button onclick="viewGame(${game.game_id})" class="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4 hover:bg-blue-600">View Details</button>
        </div>
    `
    )
    .join("");
}

// View Game Details
async function viewGame(gameId) {
  const response = await fetch(`${apiBaseUrl}/games/${gameId}`);
  const game = await response.json();
  document.getElementById("product-details").innerHTML = `
        <div class="h-60 bg-gray-700 rounded-lg mb-6"></div>
        <h3 class="text-2xl font-bold text-blue-400 mb-4">${game.title}</h3>
        <p class="text-gray-400 mb-4">${game.description}</p>
        <p class="text-gray-300 mb-2"><strong>Genre:</strong> ${game.genre}</p>
        <p class="text-gray-300 mb-2"><strong>Platform:</strong> ${
          game.platform
        }</p>
        <p class="text-gray-300 mb-4"><strong>Price:</strong> <span class="text-blue-400 font-bold">$${
          game.price
        }</span></p>
        ${
          currentUser && currentUser.role === "CUSTOMER"
            ? `<button onclick="addToCart(${game.game_id})" class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">Add to Cart</button>`
            : ""
        }
    `;
  showPage("product");
}

// Add to Cart
async function addToCart(gameId) {
  if (!currentUser || currentUser.role !== "CUSTOMER") {
    alert("Please login as a customer to add items to cart");
    showPage("login");
    return;
  }
  await fetch(`${apiBaseUrl}/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: currentUser.user_id,
      game_id: gameId,
      quantity: 1,
    }),
  });
  alert("Game added to cart");
}

// Load Cart
async function loadCart() {
  if (!currentUser || currentUser.role !== "CUSTOMER") {
    alert("Please login as a customer to view cart");
    showPage("login");
    return;
  }
  const response = await fetch(`${apiBaseUrl}/cart/${currentUser.user_id}`);
  const cartItems = await response.json();
  const cartItemsDiv = document.getElementById("cart-items");
  let total = 0;
  cartItemsDiv.innerHTML = cartItems
    .map((item) => {
      total += item.game.price * item.quantity;
      return `
            <div class="flex justify-between items-center border-b border-gray-700 py-4">
                <div>
                    <h4 class="text-lg font-bold text-blue-400">${item.game.title}</h4>
                    <p class="text-gray-400">$${item.game.price} x ${item.quantity}</p>
                </div>
                <button onclick="removeFromCart(${item.game.game_id})" class="text-red-400 hover:text-red-500">Remove</button>
            </div>
        `;
    })
    .join("");
  document.getElementById("cart-total").textContent = `Total: $${total.toFixed(
    2
  )}`;
}

// Remove from Cart
async function removeFromCart(gameId) {
  await fetch(`${apiBaseUrl}/cart`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: currentUser.user_id, game_id: gameId }),
  });
  loadCart();
}

// Checkout
document.getElementById("checkout-btn").addEventListener("click", async () => {
  if (!currentUser || currentUser.role !== "CUSTOMER") {
    alert("Please login as a customer to checkout");
    showPage("login");
    return;
  }
  const response = await fetch(`${apiBaseUrl}/cart/${currentUser.user_id}`);
  const cartItems = await response.json();
  let total = 0;
  document.getElementById("order-details").innerHTML = cartItems
    .map((item) => {
      total += item.game.price * item.quantity;
      return `
            <div class="border-b border-gray-700 py-4">
                <h4 class="text-lg font-bold text-blue-400">${item.game.title}</h4>
                <p class="text-gray-400">$${item.game.price} x ${item.quantity}</p>
            </div>
        `;
    })
    .join("");
  document.getElementById(
    "order-details"
  ).innerHTML += `<p class="text-xl font-bold text-blue-400 mt-4">Total: $${total.toFixed(
    2
  )}</p>`;
  showPage("order-summary");
});

// Confirm Order
document
  .getElementById("confirm-order-btn")
  .addEventListener("click", async () => {
    if (!currentUser || currentUser.role !== "CUSTOMER") {
      alert("Please login as a customer to place an order");
      showPage("login");
      return;
    }
    const response = await fetch(`${apiBaseUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.user_id }),
    });
    if (response.ok) {
      alert("Order placed successfully");
      showPage("orders");
      loadOrders();
    } else {
      const error = await response.json();
      alert(`Error: ${error.message}`);
    }
  });

// Load Orders
async function loadOrders() {
  if (!currentUser || currentUser.role !== "CUSTOMER") {
    alert("Please login as a customer to view orders");
    showPage("login");
    return;
  }
  const response = await fetch(`${apiBaseUrl}/orders/${currentUser.user_id}`);
  const orders = await response.json();
  document.getElementById("order-list").innerHTML = orders
    .map(
      (order) => `
        <div class="border-b border-gray-700 py-4">
            <p class="text-gray-300"><strong>Order ID:</strong> ${
              order.order_id
            }</p>
            <p class="text-gray-300"><strong>Date:</strong> ${new Date(
              order.order_date
            ).toLocaleDateString()}</p>
            <p class="text-gray-300"><strong>Total:</strong> $${
              order.total_amount
            }</p>
            <p class="text-gray-300"><strong>Status:</strong> ${
              order.status
            }</p>
        </div>
    `
    )
    .join("");
}

// Login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (response.ok) {
    currentUser = await response.json();
    updateNav();
    if (currentUser.role === "ADMIN") {
      showPage("admin-dashboard");
      loadAdminDashboard();
    } else {
      showPage("home");
      loadGames();
    }
  } else {
    alert("Invalid credentials");
  }
});

// Register
document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const role = document.getElementById("register-role").value;
    const response = await fetch(`${apiBaseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
    });
    if (response.ok) {
      alert("Registration successful. Please login.");
      showPage("login");
    } else {
      alert("Registration failed");
    }
  });

// Admin Dashboard
async function loadAdminDashboard() {
  if (!currentUser || currentUser.role !== "ADMIN") {
    alert("Access restricted to admins");
    showPage("login");
    return;
  }
  // Load Inventory
  const inventoryResponse = await fetch(`${apiBaseUrl}/games`);
  const games = await inventoryResponse.json();
  document.getElementById("admin-inventory").innerHTML = games
    .map(
      (game) => `
        <div class="flex justify-between items-center border-b border-gray-700 py-4">
            <div>
                <h4 class="text-lg font-bold text-blue-400">${game.title}</h4>
                <p class="text-gray-400">$${game.price} - Stock: ${game.stock_quantity}</p>
            </div>
            <div class="space-x-2">
                <button onclick="editGame(${game.game_id})" class="text-blue-400 hover:text-blue-500">Edit</button>
                <button onclick="deleteGame(${game.game_id})" class="text-red-400 hover:text-red-500">Delete</button>
            </div>
        </div>
    `
    )
    .join("");

  // Load Orders
  const ordersResponse = await fetch(`${apiBaseUrl}/orders`);
  const orders = await ordersResponse.json();
  document.getElementById("admin-orders").innerHTML = orders
    .map(
      (order) => `
        <div class="border-b border-gray-700 py-4">
            <p class="text-gray-300"><strong>Order ID:</strong> ${
              order.order_id
            }</p>
            <p class="text-gray-300"><strong>User:</strong> ${
              order.username
            }</p>
            <p class="text-gray-300"><strong>Total:</strong> $${
              order.total_amount
            }</p>
            <p class="text-gray-300"><strong>Status:</strong> ${
              order.status
            }</p>
            <select onchange="updateOrderStatus(${
              order.order_id
            }, this.value)" class="p-2 bg-gray-700 border border-gray-600 rounded-lg">
                <option value="PROCESSING" ${
                  order.status === "PROCESSING" ? "selected" : ""
                }>Processing</option>
                <option value="SHIPPED" ${
                  order.status === "SHIPPED" ? "selected" : ""
                }>Shipped</option>
                <option value="DELIVERED" ${
                  order.status === "DELIVERED" ? "selected" : ""
                }>Delivered</option>
            </select>
        </div>
    `
    )
    .join("");
}

// Add or Update Game
document
  .getElementById("add-game-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const game = {
      title: document.getElementById("game-title").value,
      description: document.getElementById("game-description").value,
      price: parseFloat(document.getElementById("game-price").value),
      genre: document.getElementById("game-genre").value,
      platform: document.getElementById("game-platform").value,
      stock_quantity: parseInt(document.getElementById("game-stock").value),
    };
    const method = editingGameId ? "PUT" : "POST";
    const url = editingGameId
      ? `${apiBaseUrl}/games/${editingGameId}`
      : `${apiBaseUrl}/games`;
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(game),
    });
    editingGameId = null;
    document.getElementById("add-game-form").reset();
    loadAdminDashboard();
  });

// Edit Game
async function editGame(gameId) {
  const response = await fetch(`${apiBaseUrl}/games/${gameId}`);
  const game = await response.json();
  document.getElementById("game-title").value = game.title;
  document.getElementById("game-description").value = game.description;
  document.getElementById("game-price").value = game.price;
  document.getElementById("game-genre").value = game.genre;
  document.getElementById("game-platform").value = game.platform;
  document.getElementById("game-stock").value = game.stock_quantity;
  editingGameId = gameId;
  window.scrollTo({
    top: document.getElementById("add-game-form").offsetTop,
    behavior: "smooth",
  });
}

// Delete Game
async function deleteGame(gameId) {
  await fetch(`${apiBaseUrl}/games/${gameId}`, { method: "DELETE" });
  loadAdminDashboard();
}

// Update Order Status
async function updateOrderStatus(orderId, status) {
  await fetch(`${apiBaseUrl}/orders/${orderId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  loadAdminDashboard();
}

// Initial Load
updateNav();
showPage("home");
loadGames();
