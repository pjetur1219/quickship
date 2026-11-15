import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const getCustomers = async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { addresses: true, shipments: true },
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customers", details: String(error) });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;
    const customer = await prisma.customer.create({
      data: { name, email, phone },
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ error: "Failed to create customer", details: String(error) });
  }
};

