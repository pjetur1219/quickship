import { useEffect, useState } from "react";
import {
  Truck,
  Package,
  Users,
  MapPin,
  Search,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import { api } from "./api";
import type { Address, Courier, Customer, PackageItem, Shipment } from "./types";
import "./App.css";

const SHIPMENT_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

type Tab = "overview" | "shipments" | "customers" | "couriers";

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracking lookup state
  const [trackingQuery, setTrackingQuery] = useState("");
  const [trackedShipment, setTrackedShipment] = useState<Shipment | null>(null);

  // Customer form
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "" });

  // Address form
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    postalCode: "",
    country: "",
    customerId: "",
  });

  // Courier form
  const [courierForm, setCourierForm] = useState({ name: "", email: "", phone: "" });

  // Shipment form
  const [shipmentForm, setShipmentForm] = useState({
    trackingNumber: "",
    customerId: "",
    pickupAddressId: "",
    deliveryAddressId: "",
    status: "PENDING",
  });
  const [packageDraft, setPackageDraft] = useState<PackageItem>({
    weight: 2.5,
    length: 30,
    width: 20,
    height: 15,
  });
  const [packagesToCreate, setPackagesToCreate] = useState<PackageItem[]>([
    { weight: 2.5, length: 30, width: 20, height: 15 },
  ]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [custs, cours, addrs, ships] = await Promise.all([
        api.getCustomers(),
        api.getCouriers(),
        api.getAddresses(),
        api.getShipments(),
      ]);
      setCustomers(custs);
      setCouriers(cours);
      setAddresses(addrs);
      setShipments(ships);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to backend API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSeed = async () => {
    setError(null);
    try {
      const res = await api.seedDemoData();
      await loadAll();
      setTrackingQuery(res.shipment.trackingNumber);
      const full = await api.trackShipment(res.shipment.trackingNumber);
      setTrackedShipment(full);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed demo data");
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingQuery.trim()) return;
    setError(null);
    try {
      const found = await api.trackShipment(trackingQuery.trim());
      setTrackedShipment(found);
    } catch (err) {
      setTrackedShipment(null);
      setError(err instanceof Error ? err.message : "Shipment not found");
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer(customerForm);
      setCustomerForm({ name: "", email: "", phone: "" });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer");
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAddress({
        ...addressForm,
        customerId: addressForm.customerId || undefined,
      });
      setAddressForm({ street: "", city: "", postalCode: "", country: "", customerId: "" });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create address");
    }
  };

  const handleCreateCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCourier(courierForm);
      setCourierForm({ name: "", email: "", phone: "" });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create courier");
    }
  };

  const handleAddPackageDraft = () => {
    setPackagesToCreate((prev) => [...prev, { ...packageDraft }]);
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createShipment({
        trackingNumber: shipmentForm.trackingNumber || undefined,
        customerId: shipmentForm.customerId,
        pickupAddressId: shipmentForm.pickupAddressId,
        deliveryAddressId: shipmentForm.deliveryAddressId,
        status: shipmentForm.status,
        packages: packagesToCreate,
      });
      setShipmentForm({
        trackingNumber: "",
        customerId: "",
        pickupAddressId: "",
        deliveryAddressId: "",
        status: "PENDING",
      });
      setPackagesToCreate([{ weight: 2.5, length: 30, width: 20, height: 15 }]);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shipment");
    }
  };

  const handleStatusChange = async (shipmentId: string, status: string) => {
    try {
      await api.updateShipmentStatus(shipmentId, status);
      await loadAll();
      if (trackedShipment?.id === shipmentId) {
        const refreshed = await api.trackShipment(trackedShipment.trackingNumber);
        setTrackedShipment(refreshed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleAssignCourier = async (shipmentId: string, courierId: string) => {
    if (!courierId) return;
    try {
      await api.assignCourier(shipmentId, courierId);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign courier");
    }
  };

  const inTransitCount = shipments.filter((s) =>
    ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status)
  ).length;
  const deliveredCount = shipments.filter((s) => s.status === "DELIVERED").length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Truck size={26} />
          <span>QuickShip</span>
        </div>

        <nav className="nav-list">
          <button
            className={`nav-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Search size={18} />
            Overview & Track
          </button>
          <button
            className={`nav-btn ${activeTab === "shipments" ? "active" : ""}`}
            onClick={() => setActiveTab("shipments")}
          >
            <Package size={18} />
            Shipments ({shipments.length})
          </button>
          <button
            className={`nav-btn ${activeTab === "customers" ? "active" : ""}`}
            onClick={() => setActiveTab("customers")}
          >
            <Users size={18} />
            Customers & Addresses
          </button>
          <button
            className={`nav-btn ${activeTab === "couriers" ? "active" : ""}`}
            onClick={() => setActiveTab("couriers")}
          >
            <Navigation size={18} />
            Couriers ({couriers.length})
          </button>
        </nav>

        <button className="seed-btn" onClick={handleSeed} title="Insert sample customer, courier, addresses & shipment">
          <Sparkles size={16} />
          Seed Sample Shipment
        </button>
      </aside>

      <main className="main-area">
        {error && <div className="alert">{error}</div>}

        {activeTab === "overview" && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Logistics Operations & Live Tracking</h1>
                <p className="page-subtitle">
                  Monitor shipments, packages, courier assignments, and real-time status history.
                </p>
              </div>
              <button className="btn btn-secondary" onClick={loadAll} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>

            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon">
                  <Package size={24} />
                </div>
                <div>
                  <div className="kpi-value">{shipments.length}</div>
                  <div className="kpi-label">Total Shipments</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">
                  <Truck size={24} />
                </div>
                <div>
                  <div className="kpi-value">{inTransitCount}</div>
                  <div className="kpi-label">Active / In Transit</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="kpi-value">{deliveredCount}</div>
                  <div className="kpi-label">Delivered</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">
                  <Users size={24} />
                </div>
                <div>
                  <div className="kpi-value">{customers.length}</div>
                  <div className="kpi-label">Customers</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="card-title">
                <Search size={18} /> Track a Shipment by Tracking Number
              </h2>
              <form onSubmit={handleTrack} style={{ display: "flex", gap: "0.75rem", maxWidth: "560px" }}>
                <div className="field" style={{ flex: 1 }}>
                  <input
                    placeholder="Enter tracking number (e.g. QS-123456)"
                    value={trackingQuery}
                    onChange={(e) => setTrackingQuery(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn">
                  Track Shipment
                </button>
              </form>

              {shipments.length > 0 && (
                <div style={{ marginTop: "0.85rem", fontSize: "0.82rem", color: "#64748b" }}>
                  Quick select:{" "}
                  {shipments.slice(0, 6).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: "0.4rem", marginTop: "0.25rem" }}
                      onClick={async () => {
                        setTrackingQuery(s.trackingNumber);
                        const res = await api.trackShipment(s.trackingNumber);
                        setTrackedShipment(res);
                      }}
                    >
                      {s.trackingNumber}
                    </button>
                  ))}
                </div>
              )}

              {trackedShipment && (
                <div
                  style={{
                    marginTop: "1.5rem",
                    paddingTop: "1.25rem",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                        {trackedShipment.trackingNumber}
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                        Customer: <strong>{trackedShipment.customer?.name}</strong> (
                        {trackedShipment.customer?.email})
                      </p>
                    </div>
                    <span className={`badge badge-${trackedShipment.status}`}>
                      {trackedShipment.status}
                    </span>
                  </div>

                  <div className="grid-2" style={{ marginTop: "1.25rem" }}>
                    <div>
                      <h4 style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "0.4rem" }}>
                        Route & Addresses
                      </h4>
                      <p style={{ fontSize: "0.9rem" }}>
                        <strong>Pickup:</strong> {trackedShipment.pickupAddress?.street},{" "}
                        {trackedShipment.pickupAddress?.postalCode}{" "}
                        {trackedShipment.pickupAddress?.city},{" "}
                        {trackedShipment.pickupAddress?.country}
                      </p>
                      <p style={{ fontSize: "0.9rem", marginTop: "0.35rem" }}>
                        <strong>Delivery:</strong> {trackedShipment.deliveryAddress?.street},{" "}
                        {trackedShipment.deliveryAddress?.postalCode}{" "}
                        {trackedShipment.deliveryAddress?.city},{" "}
                        {trackedShipment.deliveryAddress?.country}
                      </p>

                      <h4
                        style={{
                          fontSize: "0.85rem",
                          color: "#475569",
                          marginTop: "1rem",
                          marginBottom: "0.3rem",
                        }}
                      >
                        Packages ({trackedShipment.packages?.length || 0})
                      </h4>
                      <div className="pkg-list">
                        {trackedShipment.packages?.map((pkg, idx) => (
                          <span key={pkg.id || idx} className="pkg-pill">
                            {Number(pkg.weight)} kg — {Number(pkg.length)}×{Number(pkg.width)}×
                            {Number(pkg.height)} cm
                          </span>
                        ))}
                      </div>

                      <h4
                        style={{
                          fontSize: "0.85rem",
                          color: "#475569",
                          marginTop: "1rem",
                          marginBottom: "0.3rem",
                        }}
                      >
                        Assigned Courier
                      </h4>
                      {trackedShipment.deliveryAssignments?.length ? (
                        <p style={{ fontSize: "0.9rem" }}>
                          {trackedShipment.deliveryAssignments[0].courier?.name} (
                          {trackedShipment.deliveryAssignments[0].courier?.phone})
                        </p>
                      ) : (
                        <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>No courier assigned yet</p>
                      )}
                    </div>

                    <div>
                      <h4 style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "0.4rem" }}>
                        <Clock size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                        Shipment Status History
                      </h4>
                      <div className="timeline">
                        {trackedShipment.statusHistory?.map((hist) => (
                          <div key={hist.id} className="timeline-item">
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{hist.status}</div>
                            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                              {new Date(hist.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "shipments" && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Shipments & Packages</h1>
                <p className="page-subtitle">
                  Create shipments with dimensions/weights, assign couriers, and update status history.
                </p>
              </div>
            </div>

            <div className="card">
              <h2 className="card-title">
                <Plus size={18} /> Create New Shipment
              </h2>
              <form onSubmit={handleCreateShipment}>
                <div className="form-grid">
                  <div className="field">
                    <label>Tracking Number (optional)</label>
                    <input
                      placeholder="Auto-generated if blank"
                      value={shipmentForm.trackingNumber}
                      onChange={(e) =>
                        setShipmentForm({ ...shipmentForm, trackingNumber: e.target.value })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Customer *</label>
                    <select
                      required
                      value={shipmentForm.customerId}
                      onChange={(e) =>
                        setShipmentForm({ ...shipmentForm, customerId: e.target.value })
                      }
                    >
                      <option value="">Select customer...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Pickup Address *</label>
                    <select
                      required
                      value={shipmentForm.pickupAddressId}
                      onChange={(e) =>
                        setShipmentForm({ ...shipmentForm, pickupAddressId: e.target.value })
                      }
                    >
                      <option value="">Select pickup address...</option>
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.street}, {a.city} ({a.country})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Delivery Address *</label>
                    <select
                      required
                      value={shipmentForm.deliveryAddressId}
                      onChange={(e) =>
                        setShipmentForm({ ...shipmentForm, deliveryAddressId: e.target.value })
                      }
                    >
                      <option value="">Select delivery address...</option>
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.street}, {a.city} ({a.country})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: "0.65rem" }}>
                    Packages in Shipment ({packagesToCreate.length})
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={packageDraft.weight}
                        onChange={(e) =>
                          setPackageDraft({ ...packageDraft, weight: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Length (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={packageDraft.length}
                        onChange={(e) =>
                          setPackageDraft({ ...packageDraft, length: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Width (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={packageDraft.width}
                        onChange={(e) =>
                          setPackageDraft({ ...packageDraft, width: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Height (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={packageDraft.height}
                        onChange={(e) =>
                          setPackageDraft({ ...packageDraft, height: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddPackageDraft}>
                    + Add Another Package Box
                  </button>
                  <div className="pkg-list">
                    {packagesToCreate.map((p, idx) => (
                      <span key={idx} className="pkg-pill">
                        Box #{idx + 1}: {p.weight}kg ({p.length}×{p.width}×{p.height} cm)
                      </span>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn">
                  Create Shipment
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="card-title">All Shipments</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tracking #</th>
                      <th>Customer</th>
                      <th>Pickup → Delivery</th>
                      <th>Packages</th>
                      <th>Courier</th>
                      <th>Status</th>
                      <th>Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700 }}>{s.trackingNumber}</td>
                        <td>{s.customer?.name}</td>
                        <td>
                          {s.pickupAddress?.city} → {s.deliveryAddress?.city}
                        </td>
                        <td>{s.packages?.length || 0} pkg(s)</td>
                        <td>
                          {s.deliveryAssignments?.[0]?.courier?.name || (
                            <select
                              defaultValue=""
                              onChange={(e) => handleAssignCourier(s.id, e.target.value)}
                              style={{ padding: "0.3rem", borderRadius: "0.35rem" }}
                            >
                              <option value="">Assign courier...</option>
                              {couriers.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${s.status}`}>{s.status}</span>
                        </td>
                        <td>
                          <select
                            value={s.status}
                            onChange={(e) => handleStatusChange(s.id, e.target.value)}
                            style={{ padding: "0.35rem", borderRadius: "0.35rem" }}
                          >
                            {SHIPMENT_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {shipments.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "#64748b" }}>
                          No shipments yet. Click "Seed Sample Shipment" in the sidebar or create one above!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "customers" && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Customers & Addresses</h1>
                <p className="page-subtitle">
                  Manage customer accounts and their pickup/delivery addresses.
                </p>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <h2 className="card-title">
                  <Users size={18} /> Add Customer
                </h2>
                <form onSubmit={handleCreateCustomer}>
                  <div className="form-grid">
                    <div className="field">
                      <label>Full Name / Company *</label>
                      <input
                        required
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div className="field">
                      <label>Email *</label>
                      <input
                        required
                        type="email"
                        value={customerForm.email}
                        onChange={(e) =>
                          setCustomerForm({ ...customerForm, email: e.target.value })
                        }
                        placeholder="shipping@acme.com"
                      />
                    </div>
                    <div className="field">
                      <label>Phone *</label>
                      <input
                        required
                        value={customerForm.phone}
                        onChange={(e) =>
                          setCustomerForm({ ...customerForm, phone: e.target.value })
                        }
                        placeholder="+1 555 0100"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn">
                    Save Customer
                  </button>
                </form>

                <div className="table-wrap" style={{ marginTop: "1.25rem" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Shipments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td>{c.email}</td>
                          <td>{c.phone}</td>
                          <td>{c.shipments?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h2 className="card-title">
                  <MapPin size={18} /> Add Address
                </h2>
                <form onSubmit={handleCreateAddress}>
                  <div className="form-grid">
                    <div className="field">
                      <label>Street *</label>
                      <input
                        required
                        value={addressForm.street}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, street: e.target.value })
                        }
                        placeholder="123 Harbor Way"
                      />
                    </div>
                    <div className="field">
                      <label>City *</label>
                      <input
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="Stockholm"
                      />
                    </div>
                    <div className="field">
                      <label>Postal Code *</label>
                      <input
                        required
                        value={addressForm.postalCode}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, postalCode: e.target.value })
                        }
                        placeholder="111 22"
                      />
                    </div>
                    <div className="field">
                      <label>Country *</label>
                      <input
                        required
                        value={addressForm.country}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, country: e.target.value })
                        }
                        placeholder="Sweden"
                      />
                    </div>
                    <div className="field">
                      <label>Owner Customer (optional)</label>
                      <select
                        value={addressForm.customerId}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, customerId: e.target.value })
                        }
                      >
                        <option value="">None</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn">
                    Save Address
                  </button>
                </form>

                <div className="table-wrap" style={{ marginTop: "1.25rem" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Street</th>
                        <th>City</th>
                        <th>Postal</th>
                        <th>Country</th>
                        <th>Customer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addresses.map((a) => (
                        <tr key={a.id}>
                          <td>{a.street}</td>
                          <td>{a.city}</td>
                          <td>{a.postalCode}</td>
                          <td>{a.country}</td>
                          <td>{a.customer?.name || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "couriers" && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Couriers & Delivery Assignments</h1>
                <p className="page-subtitle">
                  Register delivery drivers and inspect their active shipment assignments.
                </p>
              </div>
            </div>

            <div className="card">
              <h2 className="card-title">
                <Plus size={18} /> Register Courier
              </h2>
              <form onSubmit={handleCreateCourier}>
                <div className="form-grid">
                  <div className="field">
                    <label>Driver Name *</label>
                    <input
                      required
                      value={courierForm.name}
                      onChange={(e) => setCourierForm({ ...courierForm, name: e.target.value })}
                      placeholder="Sara Lind"
                    />
                  </div>
                  <div className="field">
                    <label>Email *</label>
                    <input
                      required
                      type="email"
                      value={courierForm.email}
                      onChange={(e) => setCourierForm({ ...courierForm, email: e.target.value })}
                      placeholder="sara@quickship.io"
                    />
                  </div>
                  <div className="field">
                    <label>Phone *</label>
                    <input
                      required
                      value={courierForm.phone}
                      onChange={(e) => setCourierForm({ ...courierForm, phone: e.target.value })}
                      placeholder="+46 70 555 1212"
                    />
                  </div>
                </div>
                <button type="submit" className="btn">
                  Add Courier
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="card-title">Active Couriers</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Assigned Shipments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couriers.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>{c.email}</td>
                        <td>{c.phone}</td>
                        <td>
                          {c.deliveryAssignments?.length
                            ? c.deliveryAssignments
                                .map((a) => a.shipment?.trackingNumber)
                                .filter(Boolean)
                                .join(", ")
                            : "No assignments"}
                        </td>
                      </tr>
                    ))}
                    {couriers.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "#64748b" }}>
                          No couriers registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
