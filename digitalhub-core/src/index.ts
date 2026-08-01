import { fromHono } from "chanfana";
import { Hono } from "hono";

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

const app = new Hono();

const openapi = fromHono(app, {
  docs_url: "/",
});

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

export default app;