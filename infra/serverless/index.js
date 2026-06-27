import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 4100);
const region = process.env.FALLBACK_REGION ?? "local";

app.use(express.json());

app.all(/^\/api\/.*/, (req, res) => {
  res.status(503).json({
    status: "fallback",
    region,
    route: req.originalUrl,
    message:
      "Primary wallet API is temporarily unavailable. The fallback route is alive and preserving a controlled failure response."
  });
});

app.listen(port, () => {
  console.log(`Fallback routes listening on ${port}`);
});
