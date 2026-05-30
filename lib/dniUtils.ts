/**
 * Utilidades de validación de DNI y NIE español.
 *
 * DNI - Formato válido: 8 dígitos numéricos + 1 letra (mayúscula o minúscula).
 * La letra se calcula como DNI_LETTERS[número % 23].
 *
 * NIE - Formato válido: 1 letra (X, Y o Z) + 7 dígitos numéricos + 1 letra.
 * X se sustituye por 0, Y por 1, Z por 2 para calcular la letra de control.
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

/**
 * Valida que un string sea un NIE español válido.
 * - 1 letra inicial (X, Y o Z) + 7 dígitos + 1 letra de control
 * - Para calcular la letra de control: X→0, Y→1, Z→2
 *   se forma un número de 8 dígitos y se aplica la misma tabla que el DNI.
 *
 * @returns `{ valid: true, normalized: string }` si es válido (normalized = mayúsculas),
 *          `{ valid: false, error: string }` si no lo es.
 */
export function validarNIE(nie: string): { valid: true; normalized: string } | { valid: false; error: string } {
  if (!nie || typeof nie !== "string") {
    return { valid: false, error: "El NIE es obligatorio" };
  }

  const trimmed = nie.trim().toUpperCase();

  if (trimmed.length !== 9) {
    return { valid: false, error: "El NIE debe tener exactamente 9 caracteres (1 letra + 7 dígitos + 1 letra)" };
  }

  const firstLetter = trimmed.charAt(0);
  const numberPart = trimmed.slice(1, 8);
  const controlLetter = trimmed.charAt(8);

  // Verificar que la primera letra sea X, Y o Z
  if (!/^[XYZ]$/.test(firstLetter)) {
    return { valid: false, error: "El NIE debe comenzar con X, Y o Z" };
  }

  // Verificar que los 7 siguientes sean dígitos
  if (!/^\d{7}$/.test(numberPart)) {
    return { valid: false, error: "El NIE debe tener 7 dígitos después de la letra inicial" };
  }

  // Verificar que el último sea una letra
  if (!/^[A-Z]$/.test(controlLetter)) {
    return { valid: false, error: "El último carácter del NIE debe ser una letra" };
  }

  // Sustituir la letra inicial por su dígito correspondiente
  const prefixMap: Record<string, string> = { X: "0", Y: "1", Z: "2" };
  const fullNumber = prefixMap[firstLetter] + numberPart;
  const num = parseInt(fullNumber, 10);
  const expectedLetter = DNI_LETTERS[num % 23];

  if (controlLetter !== expectedLetter) {
    return {
      valid: false,
      error: `La letra de control del NIE no es correcta. Para ${trimmed.slice(0, 8)} la letra debe ser «${expectedLetter}»`,
    };
  }

  return { valid: true, normalized: trimmed };
}
