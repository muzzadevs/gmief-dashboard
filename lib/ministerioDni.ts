import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export async function buscarDniDuplicado(
  dniNormalizado: string,
  excluirMinisterioId?: number
): Promise<number | null> {
  const ministerios = await prisma.ministerio.findMany({
    where: {
      dni_encrypted: { not: null },
      ...(excluirMinisterioId !== undefined
        ? { id: { not: excluirMinisterioId } }
        : {}),
    },
    select: { id: true, dni_encrypted: true },
  });

  for (const ministerio of ministerios) {
    if (
      ministerio.dni_encrypted &&
      decrypt(ministerio.dni_encrypted) === dniNormalizado
    ) {
      return ministerio.id;
    }
  }

  return null;
}
