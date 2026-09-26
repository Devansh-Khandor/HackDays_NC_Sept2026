import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";
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
  const user=await requireUser();
  const db=await createSupabaseServerClient();
  const name=`${randomUUID()}.${extension}`;
  const objectPath=`${user.id}/${name}`;
  const contentType=extension==='jpg'?'image/jpeg':extension==='png'?'image/png':'image/webp';
  const {error}=await db.storage.from('incident-photos').upload(objectPath,buffer,{contentType,upsert:false});
  if(error)throw new AppError('Your photo could not be saved. Please try again.',502);
  const {error:recordError}=await db.from('incident_uploads').insert({filename:name,owner_id:user.id,object_path:objectPath});
  if(recordError){await db.storage.from('incident-photos').remove([objectPath]);throw new AppError('Your photo could not be saved. Please try again.',502);}
  return `/api/uploads/${name}`;
}
export async function readImage(name:string){
  await requireUser();
  if(!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(name))throw new AppError('Image not found.',404);
  const db=await createSupabaseServerClient();
  const {data:record,error}=await db.from('incident_uploads').select('object_path').eq('filename',name).maybeSingle();
  if(error||!record)throw new AppError('Image not found.',404);
  const {data,error:downloadError}=await db.storage.from('incident-photos').download(record.object_path);
  if(downloadError||!data)throw new AppError('Image not found.',404);
  return Buffer.from(await data.arrayBuffer());
}
