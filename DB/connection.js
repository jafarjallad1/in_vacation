import mongoose from "mongoose";
const connectDb = async() =>{
    try {
        await mongoose.connect(process.env.DB_LOCAL );
        console.log("MongoDB Connected");
        
    } catch (error) {
        console.error("Error connecting to MongoDB", error.message);
    }
}

export default connectDb;
