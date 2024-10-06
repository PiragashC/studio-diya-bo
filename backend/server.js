const express = require("express");
const cors = require("cors");
const connectDb = require("./config/dbConnection");
const dotenv = require("dotenv");
const morgan = require("morgan");
const http = require("http");
const authRouter = require("./routes/authRouter");
const adminRouter = require("./routes/adminRouter");
const commonRoleRouter = require("./routes/commonRoleRouter");
const bcrypt = require('bcrypt');

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Get port from environment variables or use default port 5001
const PORT = process.env.PORT || 5001;

// Middleware setup
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan("tiny")); // Logging

app.use(express.json());

async function hashPassword(password) {
  const saltRounds = 12; // You can adjust the salt rounds as needed
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
}


// Define a welcome route
app.get("/", async(req, res) => {
  const password = await hashPassword('Jude1998');
  console.log(password);
  res.json({ message: "Welcome" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/common-role", commonRoleRouter);

// Error handling middleware for Multer errors
app.use((err, req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  if (err instanceof Multer.MulterError) {
    res.status(400).json({ error: err.message });
  } else if (err) {
    res.status(400).json({ error: err.message });
  } else {
    next();
  }
});

// Start the server
server.listen(PORT, async () => {
  await connectDb();
  console.log(`Server started on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise rejection:", err);
  process.exit(1); // Exit process on unhandled promise rejection
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1); // Exit process on uncaught exception
});
