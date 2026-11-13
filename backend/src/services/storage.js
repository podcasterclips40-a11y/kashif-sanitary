import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Cloudinary if environment variables are configured
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log(`[Storage] Cloudinary configured successfully for cloud: ${cloudName}`);
} else {
  console.log('[Storage] Cloudinary not configured. Fallback to local storage (public/uploads). For production on Render, set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
}

// Ensure local uploads directory exists for fallback / local development
const localUploadsBase = path.resolve(__dirname, '../../public/uploads');
try {
  if (!fs.existsSync(localUploadsBase)) {
    fs.mkdirSync(localUploadsBase, { recursive: true });
  }
} catch (e) {
  console.error('[Storage] Error ensuring local uploads dir:', e);
}

/**
 * Returns active storage provider info
 */
export function getStorageStatus() {
  return {
    provider: isCloudinaryConfigured ? 'cloudinary' : 'local',
    is_persistent_cloud: isCloudinaryConfigured,
    cloud_name: isCloudinaryConfigured ? cloudName : null,
    message: isCloudinaryConfigured
      ? 'Persistent Cloudinary Cloud Storage is active.'
      : 'Using local storage fallback. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Render environment variables for production.',
  };
}

/**
 * Uploads an image buffer to Cloudinary (or local fallback)
 * @param {Buffer} buffer - File buffer from multer
 * @param {Object} options - { folder: 'products'|'categories', originalname, mimetype, req }
 * @returns {Promise<{url: string, provider: string, public_id?: string}>}
 */
export async function uploadImageBuffer(buffer, options = {}) {
  const folder = options.folder || 'products';

  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: `kashif_sanitary/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 1600, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
        ],
      };

      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]:', error);
          return reject(new Error(error.message || 'Cloudinary upload failed'));
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          provider: 'cloudinary',
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      });

      stream.end(buffer);
    });
  }

  // Fallback: Save to local public/uploads directory
  const targetDir = path.join(localUploadsBase, folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const ext = (options.mimetype && options.mimetype.split('/')[1]) || 'jpg';
  const cleanExt = ext === 'jpeg' ? 'jpg' : ext.replace(/[^a-z0-9]/g, '');
  const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
  const filePath = path.join(targetDir, filename);

  fs.writeFileSync(filePath, buffer);

  // Build public URL from request host if available
  let publicUrl = `/uploads/${folder}/${filename}`;
  if (options.req) {
    const protocol = options.req.headers['x-forwarded-proto'] || options.req.protocol || 'http';
    const host = options.req.get('host') || 'localhost:5000';
    publicUrl = `${protocol}://${host}/uploads/${folder}/${filename}`;
  }

  return {
    url: publicUrl,
    filename,
    provider: 'local',
  };
}

/**
 * Deletes an image if public_id or local filename is known
 */
export async function deleteImage(publicIdOrUrl) {
  if (!publicIdOrUrl) return false;

  try {
    if (isCloudinaryConfigured && !publicIdOrUrl.startsWith('http') && !publicIdOrUrl.startsWith('/')) {
      // It's a Cloudinary public_id
      await cloudinary.uploader.destroy(publicIdOrUrl);
      return true;
    }

    if (publicIdOrUrl.includes('/uploads/')) {
      const relativePath = publicIdOrUrl.split('/uploads/')[1];
      if (relativePath) {
        const fullPath = path.join(localUploadsBase, relativePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          return true;
        }
      }
    }
  } catch (err) {
    console.warn('[Storage Delete Warning]:', err.message);
  }
  return false;
}
