/**
 * Utilidades de validación de DNI español.
 *
 * Formato válido: 8 dígitos numéricos + 1 letra (mayúscula o minúscula).
 * La letra se calcula como DNI_LETTERS[número % 23].
 */

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

/**
 * Valida que un string sea un DNI español válido.
 * - 8 dígitos + 1 letra
 * - La letra debe corresponder al resto de dividir los 8 dígitos entre 23
 *
 * @returns `{ valid: true, normalized: string }` si es válido (normalized = mayúsculas),
 *          `{ valid: false, error: string }` si no lo es.
 */
export function validarDNI(dni: string): { valid: true; normalized: string } | { valid: false; error: string } {
  if (!dni || typeof dni !== "string") {
    return { valid: false, error: "El DNI es obligatorio" };
  }

  const trimmed = dni.trim();

  if (trimmed.length !== 9) {
    return { valid: false, error: "El DNI debe tener exactamente 9 caracteres (8 dígitos + 1 letra)" };
  }

  const numberPart = trimmed.slice(0, 8);
  const letterPart = trimmed.slice(8, 9).toUpperCase();

  // Verificar que los 8 primeros sean dígitos
  if (!/^\d{8}$/.test(numberPart)) {
    return { valid: false, error: "Los 8 primeros caracteres del DNI deben ser numéricos" };
  }

  // Verificar que el último sea una letra
  if (!/^[A-Z]$/.test(letterPart)) {
    return { valid: false, error: "El último carácter del DNI debe ser una letra" };
  }

  // Calcular la letra correcta
  const num = parseInt(numberPart, 10);
  const expectedLetter = DNI_LETTERS[num % 23];

  if (letterPart !== expectedLetter) {
    return {
      valid: false,
      error: `La letra del DNI no es correcta. Para el número ${numberPart} la letra debe ser «${expectedLetter}»`,
    };
  }

  return { valid: true, normalized: `${numberPart}${expectedLetter}` };
}
