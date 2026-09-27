const express = require("express");
const cors = require("cors");

const healthRoutes = require("./src/routes/healthRoutes");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);

app.use(errorHandler);

module.exports = app;