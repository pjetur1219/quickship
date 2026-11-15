import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/api.routes";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "QuickShip API" });
});

app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`QuickShip Backend running on http://localhost:${PORT}`);
});

