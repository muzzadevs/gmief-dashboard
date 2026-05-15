import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Servir la imagen de un ministerio
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const ministerio = await prisma.ministerio.findUnique({
    where: { id: Number(id) },
    select: { imagen: true },
  });

  if (!ministerio || !ministerio.imagen) {
    return NextResponse.json({ error: "Sin imagen" }, { status: 404 });
  }

  // La imagen se almacena como Buffer (Bytes en Prisma)
  const buffer = Buffer.from(ministerio.imagen);

  // Detectar tipo MIME básico desde los magic bytes
  let contentType = "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    contentType = "image/png";
  } else if (buffer[0] === 0x47 && buffer[1] === 0x49) {
    contentType = "image/gif";
  } else if (buffer[0] === 0x52 && buffer[1] === 0x49) {
    contentType = "image/webp";
  }

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

// POST: Subir/actualizar imagen de un ministerio
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("imagen") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó imagen" }, { status: 400 });
    }

    // Validar tipo
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no soportado. Use JPG, PNG, GIF o WebP" },
        { status: 400 }
      );
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen no puede superar los 10MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await prisma.ministerio.update({
      where: { id: Number(id) },
      data: { imagen: buffer },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    return NextResponse.json(
      { error: "Error al subir la imagen" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar imagen de un ministerio
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  await prisma.ministerio.update({
    where: { id: Number(id) },
    data: { imagen: null },
  });

  return NextResponse.json({ ok: true });
}
