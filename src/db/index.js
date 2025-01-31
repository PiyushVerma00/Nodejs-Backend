import 'dotenv/config'
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


// console.log("Mongo" , process.env.MONGODB_URI)

const connectDb = async ()=>{
 try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`MongoDb Connected!! DB Host: ${connectionInstance.connection.host}`);
    
 } catch (error) {
    console.error("Mongo connection error ", error);
    process.exit(1)
    
 }
}

export default connectDb