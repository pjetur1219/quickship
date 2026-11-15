import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getShipments = async (_req: Request, res: Response) => {
  try {
    const shipments = await prisma.shipment.findMany({
      include: {
        customer: true,
        pickupAddress: true,
        deliveryAddress: true,
        packages: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
        deliveryAssignments: {
          include: { courier: true },
          orderBy: { assignedAt: "desc" },
        },
      },
    });
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch shipments", details: String(error) });
  }
};

export const trackShipment = async (req: Request, res: Response) => {
  try {
    const trackingNumber = String(req.params.trackingNumber);
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber },
      include: {
        customer: true,
        pickupAddress: true,
        deliveryAddress: true,
        packages: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
        deliveryAssignments: {
          include: { courier: true },
          orderBy: { assignedAt: "desc" },
        },
      },
    });
    if (!shipment) {
      res.status(404).json({ error: "Shipment not found" });
      return;
    }
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: "Failed to track shipment", details: String(error) });
  }
};

export const createShipment = async (req: Request, res: Response) => {
  try {
    const {
      trackingNumber,
      customerId,
      pickupAddressId,
      deliveryAddressId,
      status = "PENDING",
      packages = [],
    } = req.body;

    const generatedTracking =
      trackingNumber || `QS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber: generatedTracking,
        customerId,
        pickupAddressId,
        deliveryAddressId,
        status,
        packages: {
          create: packages.map((pkg: { weight: number; length: number; width: number; height: number }) => ({
            weight: Number(pkg.weight),
            length: Number(pkg.length),
            width: Number(pkg.width),
            height: Number(pkg.height),
          })),
        },
        statusHistory: {
          create: [{ status }],
        },
      },
      include: {
        customer: true,
        pickupAddress: true,
        deliveryAddress: true,
        packages: true,
        statusHistory: true,
        deliveryAssignments: { include: { courier: true } },
      },
    });
    res.status(201).json(shipment);
  } catch (error) {
    res.status(400).json({ error: "Failed to create shipment", details: String(error) });
  }
};

export const updateShipmentStatus = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    const shipment = await prisma.shipment.update({
      where: { id },
      data: {
        status,
        statusHistory: {
          create: [{ status }],
        },
      },
      include: {
        customer: true,
        pickupAddress: true,
        deliveryAddress: true,
        packages: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
        deliveryAssignments: { include: { courier: true } },
      },
    });
    res.json(shipment);
  } catch (error) {
    res.status(400).json({ error: "Failed to update status", details: String(error) });
  }
};

export const assignCourier = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { courierId } = req.body;

    await prisma.deliveryAssignment.create({
      data: {
        shipmentId: id,
        courierId,
      },
    });

    const shipment = await prisma.shipment.update({
      where: { id },
      data: {
        status: "ASSIGNED",
        statusHistory: {
          create: [{ status: "ASSIGNED" }],
        },
      },
      include: {
        customer: true,
        pickupAddress: true,
        deliveryAddress: true,
        packages: true,
        statusHistory: { orderBy: { createdAt: "desc" } },
        deliveryAssignments: {
          include: { courier: true },
          orderBy: { assignedAt: "desc" },
        },
      },
    });

    res.json(shipment);
  } catch (error) {
    res.status(400).json({ error: "Failed to assign courier", details: String(error) });
  }
};

export const addPackageToShipment = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { weight, length, width, height } = req.body;

    const pkg = await prisma.package.create({
      data: {
        shipmentId: id,
        weight: Number(weight),
        length: Number(length),
        width: Number(width),
        height: Number(height),
      },
    });

    res.status(201).json(pkg);
  } catch (error) {
    res.status(400).json({ error: "Failed to add package", details: String(error) });
  }
};

