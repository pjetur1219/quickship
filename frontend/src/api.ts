import type { Address, Courier, Customer, PackageItem, Shipment } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "API request failed");
  }
  return res.json();
}

export const api = {
  getCustomers: () => request<Customer[]>("/customers"),
  createCustomer: (data: { name: string; email: string; phone: string }) =>
    request<Customer>("/customers", { method: "POST", body: JSON.stringify(data) }),

  getCouriers: () => request<Courier[]>("/couriers"),
  createCourier: (data: { name: string; email: string; phone: string }) =>
    request<Courier>("/couriers", { method: "POST", body: JSON.stringify(data) }),

  getAddresses: () => request<Address[]>("/addresses"),
  createAddress: (data: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    customerId?: string;
  }) => request<Address>("/addresses", { method: "POST", body: JSON.stringify(data) }),

  getShipments: () => request<Shipment[]>("/shipments"),
  trackShipment: (trackingNumber: string) =>
    request<Shipment>(`/shipments/track/${encodeURIComponent(trackingNumber)}`),
  createShipment: (data: {
    trackingNumber?: string;
    customerId: string;
    pickupAddressId: string;
    deliveryAddressId: string;
    status: string;
    packages: PackageItem[];
  }) => request<Shipment>("/shipments", { method: "POST", body: JSON.stringify(data) }),

  updateShipmentStatus: (id: string, status: string) =>
    request<Shipment>(`/shipments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  assignCourier: (id: string, courierId: string) =>
    request<Shipment>(`/shipments/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ courierId }),
    }),

  seedDemoData: () => request<{ message: string; shipment: Shipment }>("/seed", { method: "POST" }),
};

