import { Router, type IRouter, type Request } from "express";
import multer from "multer";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed."));
    }
  },
});

router.post("/upload", requireAuth, upload.single("image"), async (req: Request, res: any): Promise<void> => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  try {
    // Process image with sharp to strip EXIF data and resize if too large
    // Simply passing through sharp removes metadata by default
    const processedBuffer = await sharp(req.file.buffer)
      .rotate() // Automatically orient based on EXIF, but strips EXIF data from output
      .toBuffer();

    // Upload to Cloudinary using a stream
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "quietude", resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Failed to upload image" });
        }
        res.json({
          url: result.secure_url,
          width: result.width,
          height: result.height,
        });
      }
    );

    // End the stream with the buffer
    uploadStream.end(processedBuffer);
  } catch (error) {
    console.error("Image processing error:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

export default router;
