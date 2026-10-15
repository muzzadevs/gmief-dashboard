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

  let registrosNoDescifrables = 0;
  for (const ministerio of ministerios) {
    if (!ministerio.dni_encrypted) continue;

    let dniAlmacenado: string;
    try {
      dniAlmacenado = decrypt(ministerio.dni_encrypted);
    } catch {
      registrosNoDescifrables++;
      continue;
    }

    if (dniAlmacenado === dniNormalizado) {
      return ministerio.id;
    }
  }

  if (registrosNoDescifrables > 0) {
    console.warn(
      `[buscarDniDuplicado] Se omitieron ${registrosNoDescifrables} DNI cifrados que no se pudieron descifrar.`
    );
  }

  return null;
}
