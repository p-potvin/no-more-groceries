import express from "express";

const app = express();
const PORT = parseInt(process.env["PORT"] ?? "3001", 10);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`@nmg/api listening on http://localhost:${PORT}`);
});

export default app;
