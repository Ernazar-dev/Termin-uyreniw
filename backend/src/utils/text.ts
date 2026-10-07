/** Normalises Karakalpak text for loose comparison (case + apostrophe variants). */
export const normalizeText = (value: string) =>
  value
    .toLocaleLowerCase('kaa')
    .replace(/[‘’ʻʼ`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
