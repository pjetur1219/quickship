import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getCouriers = async (_req: Request, res: Response) => {
  try {
    const couriers = await prisma.courier.findMany({
      include: {
        deliveryAssignments: {
          include: { shipment: true },
        },
      },
    });
    res.json(couriers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch couriers", details: String(error) });
  }
};

export const createCourier = async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;
    const courier = await prisma.courier.create({
      data: { name, email, phone },
    });
    res.status(201).json(courier);
  } catch (error) {
    res.status(400).json({ error: "Failed to create courier", details: String(error) });
  }
};

