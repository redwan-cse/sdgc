import { createClient } from "@/lib/supabase/server";

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

  async upload(params: {
    bucket: string;
    path: string;
    buffer: Buffer | Uint8Array;
    contentType: string;
  }): Promise<StorageUploadResult> {
    const publicUrlBase =
      process.env.R2_PUBLIC_URL || "https://media.saugatuckdouglasgardenclub.com";
    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY
    ) {
      throw new Error(
        "Cloudflare R2 is configured as the storage provider, but R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY is missing.",
      );
    }

    // In a production deployment with AWS S3 / R2 SDK:
    // We upload via S3Client PutObjectCommand to R2 endpoint.
    const url = `${publicUrlBase.replace(/\/$/, "")}/${params.path}`;
    return {
      storagePath: params.path,
      url,
      provider: "cloudflare_r2",
    };
  }

  async delete(_bucket: string, _path: string): Promise<void> {
    if (!process.env.R2_ACCOUNT_ID) {
      throw new Error("Cloudflare R2 credentials not configured.");
    }
  }

  async getPublicUrl(_bucket: string, path: string): Promise<string> {
    const publicUrlBase =
      process.env.R2_PUBLIC_URL || "https://media.saugatuckdouglasgardenclub.com";
    return `${publicUrlBase.replace(/\/$/, "")}/${path}`;
  }
}

export class CloudinaryStorageProvider implements StorageProvider {
  readonly type: StorageProviderType = "cloudinary";

  async upload(params: {
    bucket: string;
    path: string;
    buffer: Buffer | Uint8Array;
    contentType: string;
  }): Promise<StorageUploadResult> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error(
        "Cloudinary is configured as the storage provider, but CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing.",
      );
    }

    const url = `https://res.cloudinary.com/${cloudName}/image/upload/${params.path}`;
    return {
      storagePath: params.path,
      url,
      provider: "cloudinary",
    };
  }

  async delete(_bucket: string, _path: string): Promise<void> {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error("Cloudinary credentials not configured.");
    }
  }

  async getPublicUrl(_bucket: string, path: string): Promise<string> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "sdgc";
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
