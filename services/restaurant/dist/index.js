import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import restaurantRoutes from "./routes/restaurant.js";
import menuitemsRoutes from "./routes/menuitems.js";
import cartRoutes from "./routes/cart.js";
import cors from "cors";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 8080;
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/item", menuitemsRoutes);
app.use("/api/cart", cartRoutes);
app.listen(PORT, () => {
    console.log(`Restaurant service is running on port ${PORT}`);
    connectDB();
});
