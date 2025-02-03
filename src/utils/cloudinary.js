import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_APIKEY,
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET,
});

const uploadOnCloud = async (LocalfilePath)=>{
    try {
        if(!LocalfilePath) return null
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(LocalfilePath,{
            resource_type:"auto"
        })
        //  file has been uploaded finally
        console.log("file is uploaded on cloud ",response.url);
        return response
        
    } catch (error) {
        fs.unlinkSync(LocalfilePath)// remove the lcoally saved temporary file as the upload operation got failed
        return null
    }
}