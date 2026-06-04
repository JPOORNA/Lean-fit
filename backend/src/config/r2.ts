import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: env.r2Endpoint,
  credentials: {
    accessKeyId: env.r2AccessKeyId,
    secretAccessKey: env.r2SecretAccessKey
  }
});

export const r2Config = {
  bucket: env.r2BucketName,
  baseUrl: env.r2BaseUrl
};
