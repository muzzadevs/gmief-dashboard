import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Actualizar los cargos de un ministerio: elimina los que no estén, añade los nuevos
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { cargos } = await req.json();
  if (!id || !Array.isArray(cargos)) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const ministerioId = Number(id);

  // Obtener los cargos actuales
  const currentCargos = await prisma.ministerioCargo.findMany({
    where: { ministerio_id: ministerioId },
    select: { cargo_id: true },
  });

  const currentIds = currentCargos.map((c) => c.cargo_id);

  // Eliminar los que ya no estén
  const toDelete = currentIds.filter((cargoId) => !cargos.includes(cargoId));
  if (toDelete.length > 0) {
    await prisma.ministerioCargo.deleteMany({
      where: {
        ministerio_id: ministerioId,
        cargo_id: { in: toDelete },
      },
    });
  }

  // Añadir los nuevos
  const toAdd = cargos.filter(
    (cargoId: number) => !currentIds.includes(cargoId)
  );
  if (toAdd.length > 0) {
    await prisma.ministerioCargo.createMany({
      data: toAdd.map((cargo_id: number) => ({
        ministerio_id: ministerioId,
        cargo_id,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}
