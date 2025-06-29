/**
 * Belirtilen CSS değişkeninin hesaplanmış değerini döndürür.
 * @param {string} varName - '--primary-color' gibi CSS değişken adı.
 * @returns {string} - Değişkenin renk değeri (örn. '#42b983').
 */
export const getCssVar = (varName) => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};