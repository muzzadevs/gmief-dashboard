// ── Validaciones de documentos españoles (DNI / NIE) ──

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

export function validarDNIFrontend(dni: string): { valid: boolean; error?: string } {
  if (!dni) return { valid: true };
  const trimmed = dni.trim();
  if (trimmed.length !== 9) return { valid: false, error: "El DNI debe tener 9 caracteres (8 dígitos + 1 letra)" };
  const numberPart = trimmed.slice(0, 8);
  const letterPart = trimmed.slice(8, 9).toUpperCase();
  if (!/^\d{8}$/.test(numberPart)) return { valid: false, error: "Los 8 primeros caracteres del DNI deben ser numéricos" };
  if (!/^[A-Z]$/.test(letterPart)) return { valid: false, error: "El último carácter del DNI debe ser una letra" };
  const expected = DNI_LETTERS[parseInt(numberPart, 10) % 23];
  if (letterPart !== expected) return { valid: false, error: `Letra del DNI incorrecta. Para ${numberPart} la letra debe ser «${expected}»` };
  return { valid: true };
}

export function validarNIEFrontend(nie: string): { valid: boolean; error?: string } {
  if (!nie) return { valid: true };
  const trimmed = nie.trim().toUpperCase();
  if (trimmed.length !== 9) return { valid: false, error: "El NIE debe tener 9 caracteres (1 letra + 7 dígitos + 1 letra)" };
  const firstLetter = trimmed.charAt(0);
  const numberPart = trimmed.slice(1, 8);
  const controlLetter = trimmed.charAt(8);
  if (!/^[XYZ]$/.test(firstLetter)) return { valid: false, error: "El NIE debe comenzar con X, Y o Z" };
  if (!/^\d{7}$/.test(numberPart)) return { valid: false, error: "El NIE debe tener 7 dígitos después de la letra inicial" };
  if (!/^[A-Z]$/.test(controlLetter)) return { valid: false, error: "El último carácter del NIE debe ser una letra" };
  const prefixMap: Record<string, string> = { X: "0", Y: "1", Z: "2" };
  const fullNumber = prefixMap[firstLetter] + numberPart;
  const num = parseInt(fullNumber, 10);
  const expected = DNI_LETTERS[num % 23];
  if (controlLetter !== expected) return { valid: false, error: `Letra de control del NIE incorrecta. Para ${trimmed.slice(0, 8)} la letra debe ser «${expected}»` };
  return { valid: true };
}
