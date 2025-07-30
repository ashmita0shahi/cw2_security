const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors")
dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use('/public', express.static('public'));

const corsOptions = {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    // maxAge: 3600, // Maximum age of the preflight request cache
};
app.use(cors(corsOptions));
app.use("/uploads", express.static("public/uploads"));
// Routes
const userRoutes = require("./routes/UserRoute")
app.use("/api/users", userRoutes);
app.use("/api/rooms", require("./routes/RoomRoute"));
app.use("/api/bookings", require("./routes/BookingRoute"));
app.use("/api/activity-logs", require("./routes/ActivityLogRoute"));
app.use("/api/mfa", require("./routes/MFARoute"));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
