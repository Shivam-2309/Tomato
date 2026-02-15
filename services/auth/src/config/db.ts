import mongoose from 'mongoose'

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string, {
            dbName : "Tomato",
        });
        console.log("Connection established with the Database");
    } catch (err){
        console.log("Error occured: ", err);
    }
}

export default connectDB;