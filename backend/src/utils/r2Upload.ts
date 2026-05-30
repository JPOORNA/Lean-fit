import { PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { r2Client, r2Config } from "../config/r2";
import { AppError } from "./errors";

export const uploadToR2 = async (
  file: Express.Multer.File,
  folder: string = "images"
): Promise<string> => {
  if (!file) {
    throw new AppError("No file provided", 400, "NO_FILE");
  }

  const timestamp = Date.now();
  const key = `${folder}/${timestamp}-${file.originalname}`;

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Config.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );

    return `${r2Config.baseUrl}/${key}`;
  } catch (error) {
    throw new AppError(
      "Failed to upload file to R2",
      500,
      "R2_UPLOAD_ERROR"
    );
  }
};

export const deleteFromR2 = async (url: string): Promise<void> => {
  if (!url || !url.startsWith(r2Config.baseUrl)) return;
  
  const key = url.replace(`${r2Config.baseUrl}/`, "");
  
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: r2Config.bucket,
        Key: key
      })
    );
  } catch (error) {
    console.error("Failed to delete from R2:", error);
  }
};

export const deleteMultipleFromR2 = async (urls: string[]): Promise<void> => {
  const keys = urls
    .filter(url => url && url.startsWith(r2Config.baseUrl))
    .map(url => ({ Key: url.replace(`${r2Config.baseUrl}/`, "") }));

  if (keys.length === 0) return;

  try {
    await r2Client.send(
      new DeleteObjectsCommand({
        Bucket: r2Config.bucket,
        Delete: {
          Objects: keys,
          Quiet: true
        }
      })
    );
  } catch (error) {
    console.error("Failed to delete multiple from R2:", error);
  }
};
