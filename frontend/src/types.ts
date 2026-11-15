export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses?: Address[];
  shipments?: Shipment[];
}

export interface Courier {
  id: string;
  name: string;
  email: string;
  phone: string;
  deliveryAssignments?: DeliveryAssignment[];
}

export interface Address {
  id: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  customerId?: string | null;
  customer?: Customer | null;
}

export interface PackageItem {
  id?: string;
  shipmentId?: string;
  weight: number | string;
  length: number | string;
  width: number | string;
  height: number | string;
}

export interface ShipmentStatusHistory {
  id: string;
  shipmentId: string;
  status: string;
  createdAt: string;
}

export interface DeliveryAssignment {
  id: string;
  shipmentId: string;
  courierId: string;
  assignedAt: string;
  courier?: Courier;
  shipment?: Shipment;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  customerId: string;
  pickupAddressId: string;
  deliveryAddressId: string;
  status: string;
  customer?: Customer;
  pickupAddress?: Address;
  deliveryAddress?: Address;
  packages?: PackageItem[];
  statusHistory?: ShipmentStatusHistory[];
  deliveryAssignments?: DeliveryAssignment[];
}

