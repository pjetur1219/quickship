import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getAddresses = async (_req: Request, res: Response) => {
  try {
    const addresses = await prisma.address.findMany({
      include: { customer: true },
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch addresses", details: String(error) });
  }
};

export const createAddress = async (req: Request, res: Response) => {
  try {
    const { street, city, postalCode, country, customerId } = req.body;
    const address = await prisma.address.create({
      data: {
        street,
        city,
        postalCode,
        country,
        customerId: customerId || null,
      },
      include: { customer: true },
    });
    res.status(201).json(address);
  } catch (error) {
    res.status(400).json({ error: "Failed to create address", details: String(error) });
  }
};

