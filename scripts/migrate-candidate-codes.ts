import "dotenv/config";

type CandidateRecord = {
  id: number;
  codigo: string | null;
  username: string | null;
  iglesia: { zona: { codigo: string } };
  nuevoCodigo: string;
};
type CandidateSource = Omit<CandidateRecord, "nuevoCodigo">;

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply")) {
    throw new Error("Uso: npm run migrate:candidate-codes [-- --apply]");
  }
  const apply = args.includes("--apply");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está configurada");

  const { PrismaClient } = await import("../generated/prisma/client.js");
  const { PrismaMariaDb } = await import("@prisma/adapter-mariadb");
  const adapter = new PrismaMariaDb(url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = new (PrismaClient as any)({ adapter });

  async function createPlan(db: typeof prisma): Promise<CandidateRecord[]> {
    const candidates = await db.ministerio.findMany({
      where: { tipo: "CANDIDATO" },
      select: {
        id: true,
        codigo: true,
        username: true,
        iglesia: { select: { zona: { select: { codigo: true } } } },
      },
    });
    const records = await db.ministerio.findMany({
      select: { id: true, tipo: true, codigo: true, username: true },
    });
    const candidateIds = new Set(candidates.map((candidate: CandidateSource) => candidate.id));
    const plan: CandidateRecord[] = candidates.map((candidate: CandidateSource) => ({
      ...candidate,
      nuevoCodigo: `${candidate.iglesia.zona.codigo.toUpperCase()}C${candidate.id}`,
    }));
    const targetIds = new Map<string, number[]>();

    for (const candidate of plan) {
      const ids = targetIds.get(candidate.nuevoCodigo) ?? [];
      ids.push(candidate.id);
      targetIds.set(candidate.nuevoCodigo, ids);
    }

    const conflicts = new Set<number>();
    const targetCodes = new Set(targetIds.keys());
    for (const ids of targetIds.values()) {
      if (ids.length > 1) ids.forEach((id) => conflicts.add(id));
    }
    for (const record of records) {
      if (candidateIds.has(record.id)) continue;
      if (
        (record.codigo !== null && targetCodes.has(record.codigo)) ||
        (record.username !== null && targetCodes.has(record.username))
      ) {
        conflicts.add(record.id);
      }
    }

    if (conflicts.size > 0) {
      throw new Error(
        `No se puede migrar: hay códigos duplicados o asignados a otros registros. IDs en conflicto: ${[...conflicts].join(", ")}`
      );
    }
    return plan;
  }

  try {
    if (apply) {
      let updated = 0;
      await prisma.$transaction(
        async (tx: typeof prisma) => {
          const plan = await createPlan(tx);
          const changed = plan.filter(
            (candidate) =>
              candidate.codigo !== candidate.nuevoCodigo ||
              candidate.username !== candidate.nuevoCodigo
          );
          await tx.ministerio.updateMany({
            where: { tipo: "CANDIDATO" },
            data: { codigo: null, username: null },
          });
          for (const candidate of plan) {
            await tx.ministerio.update({
              where: { id: candidate.id },
              data: { codigo: candidate.nuevoCodigo, username: candidate.nuevoCodigo },
            });
          }
          const historico = plan
            .filter((candidate) => candidate.codigo !== candidate.nuevoCodigo)
            .map((candidate) => ({
              ministerio_id: candidate.id,
              campo: "Código",
              valor_anterior: candidate.codigo,
              valor_nuevo: candidate.nuevoCodigo,
            }));
          if (historico.length > 0) {
            await tx.ministerioHistorico.createMany({ data: historico });
          }
          updated = changed.length;
        },
        { timeout: 60_000 }
      );
      console.log(`Migración completada: ${updated} candidato(s) actualizado(s).`);
    } else {
      const plan = await createPlan(prisma);
      const changed = plan.filter(
        (candidate) =>
          candidate.codigo !== candidate.nuevoCodigo ||
          candidate.username !== candidate.nuevoCodigo
      );
      console.log(`Candidatos encontrados: ${plan.length}`);
      console.log(`Registros que necesitan actualización: ${changed.length}`);
      console.log("Simulación; ejecuta con -- --apply para aplicar los cambios.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Error en la migración de códigos de candidato:", error);
  process.exitCode = 1;
});
