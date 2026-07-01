const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");
const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event-management-portal";
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "masum682005@gmail.com";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "PATEL@2312";

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL || "http://localhost:5173");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.get("/", (req, res) => {
  res.json({
    message: "Event Management Portal API is running",
    register: "POST /api/auth/register"
  });
});

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");

console.log("Events route loaded");

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

async function ensureDefaultAdmin() {
  await User.updateMany(
    { email: { $ne: DEFAULT_ADMIN_EMAIL }, role: "admin" },
    { $set: { role: "participant" } }
  );

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  const admin = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });

  if (admin) {
    admin.name = "Admin";
    admin.password = hashedPassword;
    admin.role = "admin";
    await admin.save();
    console.log(`Admin account ready: ${DEFAULT_ADMIN_EMAIL}`);
    return;
  }

  await User.create({
    name: "Admin",
    email: DEFAULT_ADMIN_EMAIL,
    password: hashedPassword,
    role: "admin"
  });

  console.log(`Default admin created: ${DEFAULT_ADMIN_EMAIL}`);
}

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  })
  .then(async () => {
    await ensureDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("MongoDB connected");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
