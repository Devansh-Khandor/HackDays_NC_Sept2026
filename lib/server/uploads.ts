import "server-only";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AppError } from "./errors";
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const types = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;
export async function validateImage(file: File) {
  if (!(file.type in types))
    throw new AppError("Please upload a JPG, PNG, or WebP image.");
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE)
    throw new AppError("Please choose an image smaller than 5 MB.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const valid =
    file.type === "image/jpeg"
      ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      : file.type === "image/png"
        ? buffer
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : buffer.toString("ascii", 0, 4) === "RIFF" &&
          buffer.toString("ascii", 8, 12) === "WEBP";
  if (!valid)
    throw new AppError("The file contents do not match a supported image.");
  return {
    buffer,
    mimeType: file.type,
    extension: types[file.type as keyof typeof types],
  };
}
export async function storeImage(buffer: Buffer, extension: string) {
  const name = `${randomUUID()}.${extension}`;
  const dir = path.join(process.cwd(), "data/uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return `/api/uploads/${name}`;
}
export async function readImage(name: string) {
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(name))
    throw new AppError("Image not found.", 404);
  try {
    return await readFile(path.join(process.cwd(), "data/uploads", name));
  } catch {
    throw new AppError("Image not found.", 404);
  }
}
