import { db, query } from '../db.js';

/**
 * Maximum image size allowed for Turso BLOB storage (2.5 MB)
 * Keeps Turso operations fast and prevents heavy memory/network usage.
 */
export const MAX_IMAGE_SIZE_BYTES = 2.5 * 1024 * 1024; // 2.5 MB

/**
 * Saves an image binary buffer directly into Turso LibSQL database as a BLOB
 * @param {Buffer} buffer - Binary file buffer
 * @param {Object} options - { filename, mimetype, entity_type, entity_id }
 * @returns {Promise<{uuid: string, url: string, filename: string, mimetype: string, size: number}>}
 */
export async function saveImageToTurso(buffer, options = {}) {
  if (!buffer || buffer.length === 0) {
    throw new Error('No image data provided');
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
    throw new Error(`Image size (${sizeMb} MB) exceeds maximum allowed limit of 2.5 MB for database storage.`);
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const mimetype = (options.mimetype || 'image/jpeg').toLowerCase();
  if (!allowedTypes.includes(mimetype)) {
    throw new Error('Unsupported image format. Allowed formats: JPG, PNG, WebP, GIF.');
  }

  // Generate safe random unique identifier
  const entityType = options.entity_type || 'product';
  const prefix = entityType.charAt(0);
  const uuid = `img_${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Sanitize filename
  const rawName = options.filename || 'image.jpg';
  const sanitizedFilename = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Convert Buffer to Uint8Array for @libsql/client BLOB binding
  const uint8Data = new Uint8Array(buffer);

  const res = await db.execute({
    sql: `INSERT INTO uploaded_images (uuid, entity_type, entity_id, filename, mimetype, size, data)
          VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, uuid, filename, mimetype, size, created_at`,
    args: [
      uuid,
      entityType,
      options.entity_id ? Number(options.entity_id) : null,
      sanitizedFilename,
      mimetype,
      buffer.length,
      uint8Data,
    ],
  });

  const row = res.rows[0];

  return {
    id: row.id,
    uuid: row.uuid,
    filename: row.filename,
    mimetype: row.mimetype,
    size: row.size,
    url: `/api/public/images/${row.uuid}`,
    created_at: row.created_at,
  };
}

/**
 * Retrieves an image by its unique UUID from Turso database
 * @param {string} uuid - Unique image identifier
 * @returns {Promise<{uuid: string, mimetype: string, size: number, data: Buffer}|null>}
 */
export async function getImageFromTurso(uuid) {
  if (!uuid) return null;

  const res = await db.execute({
    sql: `SELECT id, uuid, filename, mimetype, size, data, created_at FROM uploaded_images WHERE uuid = ?`,
    args: [uuid],
  });

  if (!res.rows || res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];
  const buffer = Buffer.from(row.data);

  return {
    id: row.id,
    uuid: row.uuid,
    filename: row.filename,
    mimetype: row.mimetype,
    size: row.size,
    data: buffer,
    created_at: row.created_at,
  };
}

/**
 * Deletes an image record from Turso database
 * @param {string} uuid - Unique image identifier
 */
export async function deleteImageFromTurso(uuid) {
  if (!uuid) return false;

  const res = await db.execute({
    sql: `DELETE FROM uploaded_images WHERE uuid = ?`,
    args: [uuid],
  });

  return res.rowsAffected > 0;
}

/**
 * Get storage metadata status
 */
export async function getTursoStorageStats() {
  const countRes = await query(`SELECT COUNT(*) as count, COALESCE(SUM(size), 0) as total_bytes FROM uploaded_images`);
  const row = countRes.rows[0] || { count: 0, total_bytes: 0 };
  const totalKb = Math.round(row.total_bytes / 1024);
  const totalMb = (row.total_bytes / (1024 * 1024)).toFixed(2);

  return {
    provider: 'turso_database',
    storage_type: 'Turso LibSQL BLOB',
    max_image_size_bytes: MAX_IMAGE_SIZE_BYTES,
    max_image_size_mb: 2.5,
    images_count: Number(row.count),
    total_size_bytes: Number(row.total_bytes),
    total_size_formatted: `${totalMb} MB (${totalKb} KB)`,
  };
}
