const express = require("express");
const cors = require("cors");

const healthRoutes = require("./src/routes/healthRoutes");
const authRoutes = require("./src/routes/authRoutes");
const therapistRoutes = require("./src/routes/therapistRoutes");
const availabilityRoutes = require("./src/routes/availabilityRoutes");
const schedulingRoutes = require("./src/routes/schedulingRoutes");
const clientRoutes = require("./src/routes/clientRoutes");
const packageRoutes = require("./src/routes/packageRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");

const errorHandler = require("./src/middleware/errorHandler");

const app = express();

app.use(cors());

app.use(
  express.json({
    verify: (req, res, buffer) => {
      if (
        req.originalUrl ===
        "/api/payments/webhook/razorpay"
      ) {
        req.rawBody = buffer;
      }
    },
  })
);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/therapists", therapistRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/scheduling", schedulingRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/payments", paymentRoutes);

app.use(errorHandler);

module.exports = app;