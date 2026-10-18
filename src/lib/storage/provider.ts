import { createClient } from "@/lib/supabase/server";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { type UploadApiResponse, v2 as cloudinary } from "cloudinary";

export type StorageProviderType = "supabase" | "cloudflare_r2" | "cloudinary";

export interface StorageUploadResult {
  storagePath: string;
  url: string;
  provider: StorageProviderType;
}

export interface StorageProvider {
  type: StorageProviderType;
  upload(params: {
    bucket: string;
    path: string;
    buffer: Buffer | Uint8Array;
    contentType: string;
  }): Promise<StorageUploadResult>;
  delete(bucket: string, path: string): Promise<void>;
  getPublicUrl(bucket: string, path: string): Promise<string>;
}

export class SupabaseStorageProvider implements StorageProvider {
  readonly type: StorageProviderType = "supabase";

  async upload(params: {
    bucket: string;
    path: string;
    buffer: Buffer | Uint8Array;
    contentType: string;
  }): Promise<StorageUploadResult> {
    const supabase = await createClient();
    const { error } = await supabase.storage
      .from(params.bucket)
      .upload(params.path, params.buffer, {
        contentType: params.contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase storage upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from(params.bucket).getPublicUrl(params.path);
    return {
      storagePath: params.path,
      url: data.publicUrl,
      provider: "supabase",
    };
  }

  async delete(bucket: string, path: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      throw new Error(`Supabase storage delete failed: ${error.message}`);
    }
  }

  async getPublicUrl(bucket: string, path: string): Promise<string> {
    const supabase = await createClient();
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}

export class CloudflareR2StorageProvider implements StorageProvider {
  readonly type: StorageProviderType = "cloudflare_r2";

  private getClient(): { s3: S3Client; bucketName: string; publicUrlBase: string } {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "club-media";
    const publicUrlBase =
      process.env.R2_PUBLIC_URL || "https://media.saugatuckdouglasgardenclub.com";

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "Cloudflare R2 is configured as the storage provider, but R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY is missing.",
      );
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return { s3, bucketName, publicUrlBase };
  }

  async upload(params: {
    bucket: string;
    path: string;
    buffer: Buffer | Uint8Array;
    contentType: string;
  }): Promise<StorageUploadResult> {
    const { s3, bucketName, publicUrlBase } = this.getClient();
    const targetBucket = process.env.R2_BUCKET_NAME || params.bucket || bucketName;

    await s3.send(
      new PutObjectCommand({
        Bucket: targetBucket,
        Key: params.path,
        Body: params.buffer,
        ContentType: params.contentType,
      }),
    );

    const url = `${publicUrlBase.replace(/\/$/, "")}/${params.path}`;
    return {
      storagePath: params.path,
      url,
      provider: "cloudflare_r2",
    };
  }

  async delete(bucket: string, path: string): Promise<void> {
    const { s3, bucketName } = this.getClient();
    const targetBucket = process.env.R2_BUCKET_NAME || bucket || bucketName;

    await s3.send(
      new DeleteObjectCommand({
        Bucket: targetBucket,
        Key: path,
      }),
    );
  }

  async getPublicUrl(_bucket: string, path: string): Promise<string> {
    const publicUrlBase =
      process.env.R2_PUBLIC_URL || "https://media.saugatuckdouglasgardenclub.com";
    return `${publicUrlBase.replace(/\/$/, "")}/${path}`;
  }
}

export class CloudinaryStorageProvider implements StorageProvider {
  readonly type: StorageProviderType = "cloudinary";

  private configure(): { cloudName: string } {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        "Cloudinary is configured as the storage provider, but CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing.",
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    return { cloudName };
  }

  async upload(params: {
    bucket: string;
    path: string;
    buffer: Buffer | Uint8Array;
    contentType: string;
  }): Promise<StorageUploadResult> {
    this.configure();

    const cleanPublicId = params.path.replace(/\.[^/.]+$/, "");

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: cleanPublicId,
          folder: params.bucket || "sdgc",
          resource_type: "auto",
        },
        (error, res) => {
          if (error || !res) {
            reject(new Error(`Cloudinary upload failed: ${error?.message || "Unknown error"}`));
          } else {
            resolve(res);
          }
        },
      );
      uploadStream.end(params.buffer);
    });

    return {
      storagePath: result.public_id,
      url: result.secure_url || result.url,
      provider: "cloudinary",
    };
  }

  async delete(_bucket: string, path: string): Promise<void> {
    this.configure();
    await cloudinary.uploader.destroy(path, { resource_type: "image" });
  }

  async getPublicUrl(_bucket: string, path: string): Promise<string> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "sdgc";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `https://res.cloudinary.com/${cloudName}/image/upload/${path}`;
  }
}

export function getStorageProvider(): StorageProvider {
  const providerType = (process.env.STORAGE_PROVIDER || "supabase").toLowerCase();

  switch (providerType) {
    case "cloudflare_r2":
    case "r2":
      return new CloudflareR2StorageProvider();
    case "cloudinary":
      return new CloudinaryStorageProvider();
    default:
      return new SupabaseStorageProvider();
  }
}
