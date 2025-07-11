import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});





const uploadFileOnCloudinary = async (buffer, filename = 'resume.pdf') => {
  if (!buffer) return;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: randomUUID(),
        resource_type: 'raw',
        filename_override: filename,
        type: 'upload',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(null);
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

export default uploadFileOnCloudinary;