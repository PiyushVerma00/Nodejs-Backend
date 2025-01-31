import 'dotenv/config'

import connectDb from "./db/index.js";
import { app } from './app.js';

const PORT = process.env.PORT|| 8000

connectDb()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`Server is running at Port: ${PORT}`)        
    })
})
.catch((error)=>{   
    console.log("MongoDb Connection Failed ", error);
    
})












// import express from 'express';
// const app = express()



// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.listen(process.env.PORT, ()=>{
//             console.log('MongoDB connected at port: ', process.env.PORT);
            
//         })
//     } catch (error) {
//         console.log('Error ', error);
//         throw error
//     }
// })()
