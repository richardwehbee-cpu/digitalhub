import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { AuthLogin } from "./endpoints/authLogin";
import { AuthChangePassword } from "./endpoints/authChangePassword";

import { UserMe } from "./endpoints/userMe";
import { UserMeUpdate } from "./endpoints/userMeUpdate";
import { UserList } from "./endpoints/userList";
import { UserCreate } from "./endpoints/userCreate";
import { UserUpdate } from "./endpoints/userUpdate";
import { UserDelete } from "./endpoints/userDelete";

import { ProductCreate } from "./endpoints/productCreate";
import { ProductList } from "./endpoints/productList";
import { ProductFetch } from "./endpoints/productFetch";
import { ProductUpdate } from "./endpoints/productUpdate";
import { ProductRemove } from "./endpoints/productRemove";

import { CustomerCreate } from "./endpoints/customerCreate";
import { CustomerList } from "./endpoints/customerList";
import { CustomerFetch } from "./endpoints/customerFetch";
import { CustomerUpdate } from "./endpoints/customerUpdate";
import { CustomerDelete } from "./endpoints/customerDelete";

import { OrderCreate } from "./endpoints/orderCreate";
import { OrderList } from "./endpoints/orderList";
import { OrderFetch } from "./endpoints/orderFetch";
import { OrderUpdate } from "./endpoints/orderUpdate";
import { OrderDelete } from "./endpoints/orderDelete";

import { SupplierCreate } from "./endpoints/supplierCreate";
import { SupplierList } from "./endpoints/supplierList";
import { SupplierFetch } from "./endpoints/supplierFetch";
import { SupplierUpdate } from "./endpoints/supplierUpdate";
import { SupplierRemove } from "./endpoints/supplierRemove";

import { InventoryCreate } from "./endpoints/inventoryCreate";
import { InventoryList } from "./endpoints/inventoryList";
import { InventoryFetch } from "./endpoints/inventoryFetch";
import { InventoryUpdate } from "./endpoints/inventoryUpdate";
import { InventoryRemove } from "./endpoints/inventoryRemove";

import { CategoryCreate } from "./endpoints/categoryCreate";
import { CategoryList } from "./endpoints/categoryList";
import { CategoryFetch } from "./endpoints/categoryFetch";
import { CategoryUpdate } from "./endpoints/categoryUpdate";
import { CategoryRemove } from "./endpoints/categoryRemove";

// ── Middleware ────────────────────────────────────────────────
import { authMiddleware } from "./middleware/auth";
import {
  adminOnly,
  managerOrAbove,
  viewerOrAbove,
} from "./middleware/roles";

const app = new Hono();

// CORS
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      const allowed = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ];
      return allowed.includes(origin) ? origin : "";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Authentication middleware (public login, rest protected) ──
app.use("/api/*", async (c, next) => {
  // Skip authentication for login endpoint (supports both /api/auth/login and /api/auth/login/)
  const path = c.req.path;
  if (path === "/api/auth/login" || path === "/api/auth/login/") {
    return next();
  }

  // All other /api/* routes require authentication
  return authMiddleware(c, next);
});

// ── Role‑based protection for /api/users and /api/users/* ──
app.use("/api/users*", async (c, next) => {
  // Skip /api/users/me (handled internally)
  if (c.req.path === "/api/users/me") {
    await next();
    return;
  }

  // GET → Manager or above
  if (c.req.method === "GET") {
    await managerOrAbove(c, next);
  } else {
    await next();
  }
});

app.use("/api/users*", async (c, next) => {
  // Skip /api/users/me
  if (c.req.path === "/api/users/me") {
    await next();
    return;
  }

  // POST, PUT, DELETE → Admin only
  if (
    c.req.method === "POST" ||
    c.req.method === "PUT" ||
    c.req.method === "DELETE"
  ) {
    await adminOnly(c, next);
  } else {
    await next();
  }
});

// ── OpenAPI setup ────────────────────────────────────────────
const openapi = fromHono(app, {
  docs_url: "/",
});

// Auth
openapi.post("/api/auth/login", AuthLogin);
openapi.post("/api/auth/change-password", AuthChangePassword);

// User (self)
openapi.get("/api/users/me", UserMe);
openapi.put("/api/users/me", UserMeUpdate);

// User management
openapi.get("/api/users", UserList);
openapi.post("/api/users", UserCreate);
openapi.put("/api/users/:id", UserUpdate);
openapi.delete("/api/users/:id", UserDelete);

// Products
openapi.post("/api/products", ProductCreate);
openapi.get("/api/products", ProductList);
openapi.get("/api/products/:id", ProductFetch);
openapi.put("/api/products/:id", ProductUpdate);
openapi.delete("/api/products/:id", ProductRemove);

// Customers
openapi.post("/api/customers", CustomerCreate);
openapi.get("/api/customers", CustomerList);
openapi.get("/api/customers/:id", CustomerFetch);
openapi.put("/api/customers/:id", CustomerUpdate);
openapi.delete("/api/customers/:id", CustomerDelete);

// Orders
openapi.post("/api/orders", OrderCreate);
openapi.get("/api/orders", OrderList);
openapi.get("/api/orders/:id", OrderFetch);
openapi.put("/api/orders/:id", OrderUpdate);
openapi.delete("/api/orders/:id", OrderDelete);

// Suppliers
openapi.post("/api/suppliers", SupplierCreate);
openapi.get("/api/suppliers", SupplierList);
openapi.get("/api/suppliers/:id", SupplierFetch);
openapi.put("/api/suppliers/:id", SupplierUpdate);
openapi.delete("/api/suppliers/:id", SupplierRemove);

// Inventory
openapi.post("/api/inventory", InventoryCreate);
openapi.get("/api/inventory", InventoryList);
openapi.get("/api/inventory/:id", InventoryFetch);
openapi.put("/api/inventory/:id", InventoryUpdate);
openapi.delete("/api/inventory/:id", InventoryRemove);

// Categories
openapi.post("/api/categories", CategoryCreate);
openapi.get("/api/categories", CategoryList);
openapi.get("/api/categories/:id", CategoryFetch);
openapi.put("/api/categories/:id", CategoryUpdate);
openapi.delete("/api/categories/:id", CategoryRemove);

export default app;