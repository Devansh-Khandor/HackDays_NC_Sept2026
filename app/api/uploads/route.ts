import { requireUser } from "@/lib/auth/server";
import { validateImage, storeImage } from "@/lib/server/uploads";
import { apiError, AppError } from "@/lib/server/errors";
export const runtime = "nodejs";
// Resolution evidence photos from employees; reporters upload through /api/analyze.
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "employee")
      throw new AppError(
        "Only assigned employees can attach work photos.",
        403,
      );
    if (Number(request.headers.get("content-length") ?? 0) > 6 * 1024 * 1024)
      throw new AppError("Please choose an image smaller than 5 MB.", 413);
    const file = (await request.formData()).get("image");
    if (!(file instanceof File) || !file.size)
      throw new AppError("Choose a photo to upload.");
    const image = await validateImage(file);
    return Response.json(
      { image: await storeImage(image.buffer, image.extension) },
      { status: 201 },
    );
  } catch (e) {
    return apiError(e);
  }
}
