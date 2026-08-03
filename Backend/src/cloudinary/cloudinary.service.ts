import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ImageKit = require('imagekit');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class CloudinaryService {
  private readonly imagekit: InstanceType<typeof ImageKit>;

  constructor(private readonly config: ConfigService) {
    this.imagekit = new ImageKit({
      publicKey: config.get<string>('IMAGEKIT_PUBLIC_KEY')!,
      privateKey: config.get<string>('IMAGEKIT_PRIVATE_KEY')!,
      urlEndpoint: config.get<string>('IMAGEKIT_URL_ENDPOINT')!,
    });
  }

  /**
   * Upload a file buffer to ImageKit.
   * @param file    Multer file object
   * @param folder  Target folder (e.g. "receipts", "avatars")
   * @returns       The secure URL of the uploaded file
   */
  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File too large. Maximum size is 5 MB.');
    }

    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;

    const response = await this.imagekit.upload({
      file: file.buffer,
      fileName,
      folder: `investo/${folder}`,
      useUniqueFileName: true,
    });

    return response.url as string;
  }

  /**
   * Delete a file by its ImageKit fileId.
   */
  async delete(fileId: string): Promise<void> {
    await this.imagekit.deleteFile(fileId);
  }
}
