import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET ?? "eleviq-uploads";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function putFile(
  key: string,
  file: File
): Promise<{ url: string }> {
  const bytes = await file.arrayBuffer();
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: file.type || "application/octet-stream",
    })
  );
  return { url: `${R2_PUBLIC_URL}/${key}` };
}
