import { MongoClient } from "mongodb";
let client;
let db;
export const connectDB = async () => {
    if (db)
        return db;
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log("Admin Service Connected to MongoDB");
    return db;
};
