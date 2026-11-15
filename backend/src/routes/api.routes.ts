import { Router, Request, Response } from "express";
import { getCustomers, createCustomer } from "../controllers/customer.controller";
import { getCouriers, createCourier } from "../controllers/courier.controller";
import { getAddresses, createAddress } from "../controllers/address.controller";
import {
  getShipments,
  trackShipment,
  createShipment,
  updateShipmentStatus,
  assignCourier,
  addPackageToShipment,
} from "../controllers/shipment.controller";
import { prisma } from "../config/prisma";

const router = Router();

// Customers
router.get("/customers", getCustomers);
router.post("/customers", createCustomer);

// Couriers
router.get("/couriers", getCouriers);
router.post("/couriers", createCourier);

// Addresses
router.get("/addresses", getAddresses);
router.post("/addresses", createAddress);

// Shipments
router.get("/shipments", getShipments);
router.get("/shipments/track/:trackingNumber", trackShipment);
router.post("/shipments", createShipment);
router.patch("/shipments/:id/status", updateShipmentStatus);
router.post("/shipments/:id/assign", assignCourier);
router.post("/shipments/:id/packages", addPackageToShipment);

// Demo Seed helper
router.post("/seed", async (_req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.create({
      data: {
        name: "Nordic Logistics AB",
        email: "ops@nordiclogistics.se",
        phone: "+46 70 123 4567",
      },
    });

    const courier = await prisma.courier.create({
      data: {
        name: "Erik Lindqvist",
        email: "erik@quickship.io",
        phone: "+46 73 987 6543",
      },
    });

    const pickupAddr = await prisma.address.create({
      data: {
        street: "Sveavägen 44",
        city: "Stockholm",
        postalCode: "111 34",
        country: "Sweden",
        customerId: customer.id,
      },
    });

    const deliveryAddr = await prisma.address.create({
      data: {
        street: "Avenyn 18",
        city: "Gothenburg",
        postalCode: "411 36",
        country: "Sweden",
        customerId: customer.id,
      },
    });

    const trackingNum = `QS-${Math.floor(100000 + Math.random() * 900000)}`;
    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber: trackingNum,
        customerId: customer.id,
        pickupAddressId: pickupAddr.id,
        deliveryAddressId: deliveryAddr.id,
        status: "IN_TRANSIT",
        packages: {
          create: [
            { weight: 4.5, length: 40, width: 30, height: 25 },
            { weight: 1.2, length: 20, width: 15, height: 10 },
          ],
        },
        statusHistory: {
          create: [
            { status: "PENDING" },
            { status: "ASSIGNED" },
            { status: "IN_TRANSIT" },
          ],
        },
        deliveryAssignments: {
          create: [{ courierId: courier.id }],
        },
      },
    });

    res.status(201).json({ message: "Sample data seeded", shipment });
  } catch (error) {
    res.status(500).json({ error: "Failed to seed sample data", details: String(error) });
  }
});

export default router;

