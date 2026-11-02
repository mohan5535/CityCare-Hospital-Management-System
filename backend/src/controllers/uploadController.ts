import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sendSuccess, sendError } from '../utils/response';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const uploadFile = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fileName, fileType, fileData, category = 'OTHER' } = req.body;

    if (!fileData) {
      return sendError(res, 'File data is required', 400);
    }

    let mimeType = fileType?.toLowerCase();
    let base64Content = fileData;

    // Support data URL format: data:image/png;base64,iVBORw0KGgo...
    if (fileData.startsWith('data:')) {
      const match = fileData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1].toLowerCase();
        base64Content = match[2];
      }
    }

    if (!mimeType || !ALLOWED_MIME_TYPES[mimeType]) {
      return sendError(
        res,
        'Invalid file type. Allowed formats: JPG, PNG, WEBP, and PDF only.',
        400
      );
    }

    const buffer = Buffer.from(base64Content, 'base64');

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      return sendError(
        res,
        `File exceeds maximum limit of 10MB. Current size: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB`,
        400
      );
    }

    const extension = ALLOWED_MIME_TYPES[mimeType];
    const uploadsDir = path.resolve(__dirname, '../../uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueId = crypto.randomBytes(8).toString('hex');
    const safeBaseName = (fileName || 'document')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const targetFilename = `${category.toLowerCase()}-${Date.now()}-${uniqueId}-${safeBaseName}${extension}`;
    const targetPath = path.join(uploadsDir, targetFilename);

    await fs.promises.writeFile(targetPath, buffer);

    const fileUrl = `/uploads/${targetFilename}`;

    return sendSuccess(
      res,
      {
        name: fileName || targetFilename,
        fileUrl,
        fileSize: buffer.length,
        mimeType,
        documentType: category,
      },
      'File uploaded successfully',
      201
    );
  } catch (error: any) {
    return sendError(res, error.message || 'File upload failed', 500);
  }
};

