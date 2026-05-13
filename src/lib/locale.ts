// Currency and locale mappings based on country codes
export const LOCALE_CURRENCY_MAP: Record<string, { currency: string; symbol: string; locale: string }> = {
  US: { currency: "USD", symbol: "$", locale: "en-US" },
  GB: { currency: "GBP", symbol: "£", locale: "en-GB" },
  EU: { currency: "EUR", symbol: "€", locale: "de-DE" },
  DE: { currency: "EUR", symbol: "€", locale: "de-DE" },
  FR: { currency: "EUR", symbol: "€", locale: "fr-FR" },
  ES: { currency: "EUR", symbol: "€", locale: "es-ES" },
  IT: { currency: "EUR", symbol: "€", locale: "it-IT" },
  NL: { currency: "EUR", symbol: "€", locale: "nl-NL" },
  BE: { currency: "EUR", symbol: "€", locale: "nl-BE" },
  AT: { currency: "EUR", symbol: "€", locale: "de-AT" },
  PT: { currency: "EUR", symbol: "€", locale: "pt-PT" },
  IE: { currency: "EUR", symbol: "€", locale: "en-IE" },
  CA: { currency: "CAD", symbol: "C$", locale: "en-CA" },
  AU: { currency: "AUD", symbol: "A$", locale: "en-AU" },
  NZ: { currency: "NZD", symbol: "NZ$", locale: "en-NZ" },
  JP: { currency: "JPY", symbol: "¥", locale: "ja-JP" },
  CN: { currency: "CNY", symbol: "¥", locale: "zh-CN" },
  KR: { currency: "KRW", symbol: "₩", locale: "ko-KR" },
  IN: { currency: "INR", symbol: "₹", locale: "hi-IN" },
  BR: { currency: "BRL", symbol: "R$", locale: "pt-BR" },
  MX: { currency: "MXN", symbol: "$", locale: "es-MX" },
  AR: { currency: "ARS", symbol: "$", locale: "es-AR" },
  CL: { currency: "CLP", symbol: "$", locale: "es-CL" },
  CO: { currency: "COP", symbol: "$", locale: "es-CO" },
  ZA: { currency: "ZAR", symbol: "R", locale: "en-ZA" },
  CH: { currency: "CHF", symbol: "CHF", locale: "de-CH" },
  SE: { currency: "SEK", symbol: "kr", locale: "sv-SE" },
  NO: { currency: "NOK", symbol: "kr", locale: "nb-NO" },
  DK: { currency: "DKK", symbol: "kr", locale: "da-DK" },
  PL: { currency: "PLN", symbol: "zł", locale: "pl-PL" },
  RU: { currency: "RUB", symbol: "₽", locale: "ru-RU" },
  TR: { currency: "TRY", symbol: "₺", locale: "tr-TR" },
  AE: { currency: "AED", symbol: "د.إ", locale: "ar-AE" },
  SA: { currency: "SAR", symbol: "﷼", locale: "ar-SA" },
  SG: { currency: "SGD", symbol: "S$", locale: "en-SG" },
  HK: { currency: "HKD", symbol: "HK$", locale: "zh-HK" },
  TW: { currency: "TWD", symbol: "NT$", locale: "zh-TW" },
  TH: { currency: "THB", symbol: "฿", locale: "th-TH" },
  MY: { currency: "MYR", symbol: "RM", locale: "ms-MY" },
  ID: { currency: "IDR", symbol: "Rp", locale: "id-ID" },
  PH: { currency: "PHP", symbol: "₱", locale: "en-PH" },
  VN: { currency: "VND", symbol: "₫", locale: "vi-VN" },
  IL: { currency: "ILS", symbol: "₪", locale: "he-IL" },
  EG: { currency: "EGP", symbol: "E£", locale: "ar-EG" },
  NG: { currency: "NGN", symbol: "₦", locale: "en-NG" },
  KE: { currency: "KES", symbol: "KSh", locale: "sw-KE" },
};

// Language names for display
export const LANGUAGE_NAMES: Record<string, string> = {
  "en-US": "English (US)",
  "en-GB": "English (UK)",
  "en-CA": "English (Canada)",
  "en-AU": "English (Australia)",
  "en-NZ": "English (New Zealand)",
  "en-IE": "English (Ireland)",
  "en-ZA": "English (South Africa)",
  "en-SG": "English (Singapore)",
  "en-PH": "English (Philippines)",
  "en-NG": "English (Nigeria)",
  "de-DE": "Deutsch (Deutschland)",
  "de-AT": "Deutsch (Österreich)",
  "de-CH": "Deutsch (Schweiz)",
  "fr-FR": "Français (France)",
  "es-ES": "Español (España)",
  "es-MX": "Español (México)",
  "es-AR": "Español (Argentina)",
  "es-CL": "Español (Chile)",
  "es-CO": "Español (Colombia)",
  "it-IT": "Italiano",
  "nl-NL": "Nederlands",
  "nl-BE": "Nederlands (België)",
  "pt-PT": "Português (Portugal)",
  "pt-BR": "Português (Brasil)",
  "ja-JP": "日本語",
  "zh-CN": "中文 (简体)",
  "zh-HK": "中文 (香港)",
  "zh-TW": "中文 (繁體)",
  "ko-KR": "한국어",
  "hi-IN": "हिन्दी",
  "sv-SE": "Svenska",
  "nb-NO": "Norsk",
  "da-DK": "Dansk",
  "pl-PL": "Polski",
  "ru-RU": "Русский",
  "tr-TR": "Türkçe",
  "ar-AE": "العربية (الإمارات)",
  "ar-SA": "العربية (السعودية)",
  "ar-EG": "العربية (مصر)",
  "th-TH": "ไทย",
  "ms-MY": "Bahasa Melayu",
  "id-ID": "Bahasa Indonesia",
  "vi-VN": "Tiếng Việt",
  "he-IL": "עברית",
  "sw-KE": "Kiswahili",
};

// Currency names for display
export const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar ($)",
  GBP: "British Pound (£)",
  EUR: "Euro (€)",
  CAD: "Canadian Dollar (C$)",
  AUD: "Australian Dollar (A$)",
  NZD: "New Zealand Dollar (NZ$)",
  JPY: "Japanese Yen (¥)",
  CNY: "Chinese Yuan (¥)",
  KRW: "South Korean Won (₩)",
  INR: "Indian Rupee (₹)",
  BRL: "Brazilian Real (R$)",
  MXN: "Mexican Peso ($)",
  ARS: "Argentine Peso ($)",
  CLP: "Chilean Peso ($)",
  COP: "Colombian Peso ($)",
  ZAR: "South African Rand (R)",
  CHF: "Swiss Franc (CHF)",
  SEK: "Swedish Krona (kr)",
  NOK: "Norwegian Krone (kr)",
  DKK: "Danish Krone (kr)",
  PLN: "Polish Złoty (zł)",
  RUB: "Russian Ruble (₽)",
  TRY: "Turkish Lira (₺)",
  AED: "UAE Dirham (د.إ)",
  SAR: "Saudi Riyal (﷼)",
  SGD: "Singapore Dollar (S$)",
  HKD: "Hong Kong Dollar (HK$)",
  TWD: "Taiwan Dollar (NT$)",
  THB: "Thai Baht (฿)",
  MYR: "Malaysian Ringgit (RM)",
  IDR: "Indonesian Rupiah (Rp)",
  PHP: "Philippine Peso (₱)",
  VND: "Vietnamese Dong (₫)",
  ILS: "Israeli Shekel (₪)",
  EGP: "Egyptian Pound (E£)",
  NGN: "Nigerian Naira (₦)",
  KES: "Kenyan Shilling (KSh)",
};

/**
 * Detect user's locale settings from browser
 */
export function detectUserLocale(): { currency: string; symbol: string; locale: string } {
  // Get browser language
  const browserLocale = navigator.language || "en-US";
  
  // Try to get timezone to infer country
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Map timezone to country (simplified mapping)
  const timezoneToCountry: Record<string, string> = {
    "America/New_York": "US",
    "America/Los_Angeles": "US",
    "America/Chicago": "US",
    "America/Denver": "US",
    "America/Phoenix": "US",
    "America/Toronto": "CA",
    "America/Vancouver": "CA",
    "America/Mexico_City": "MX",
    "America/Sao_Paulo": "BR",
    "America/Buenos_Aires": "AR",
    "America/Santiago": "CL",
    "America/Bogota": "CO",
    "Europe/London": "GB",
    "Europe/Paris": "FR",
    "Europe/Berlin": "DE",
    "Europe/Madrid": "ES",
    "Europe/Rome": "IT",
    "Europe/Amsterdam": "NL",
    "Europe/Brussels": "BE",
    "Europe/Vienna": "AT",
    "Europe/Lisbon": "PT",
    "Europe/Dublin": "IE",
    "Europe/Zurich": "CH",
    "Europe/Stockholm": "SE",
    "Europe/Oslo": "NO",
    "Europe/Copenhagen": "DK",
    "Europe/Warsaw": "PL",
    "Europe/Moscow": "RU",
    "Europe/Istanbul": "TR",
    "Asia/Tokyo": "JP",
    "Asia/Shanghai": "CN",
    "Asia/Hong_Kong": "HK",
    "Asia/Taipei": "TW",
    "Asia/Seoul": "KR",
    "Asia/Kolkata": "IN",
    "Asia/Singapore": "SG",
    "Asia/Bangkok": "TH",
    "Asia/Kuala_Lumpur": "MY",
    "Asia/Jakarta": "ID",
    "Asia/Manila": "PH",
    "Asia/Ho_Chi_Minh": "VN",
    "Asia/Dubai": "AE",
    "Asia/Riyadh": "SA",
    "Asia/Jerusalem": "IL",
    "Australia/Sydney": "AU",
    "Australia/Melbourne": "AU",
    "Australia/Brisbane": "AU",
    "Australia/Perth": "AU",
    "Pacific/Auckland": "NZ",
    "Africa/Johannesburg": "ZA",
    "Africa/Cairo": "EG",
    "Africa/Lagos": "NG",
    "Africa/Nairobi": "KE",
  };

  // Try to get country from timezone
  let countryCode = timezoneToCountry[timezone];
  
  // Fallback to browser locale country
  if (!countryCode && browserLocale.includes("-")) {
    countryCode = browserLocale.split("-")[1].toUpperCase();
  }

  // Get currency info for the country
  const localeInfo = LOCALE_CURRENCY_MAP[countryCode];
  
  if (localeInfo) {
    return localeInfo;
  }

  // Default to USD/English (en-US is always the default)
  return { currency: "USD", symbol: "$", locale: "en-US" };
}

/**
 * Format currency amount based on locale settings
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = "USD",
  locale: string = "en-US"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if currency code is not supported
    const symbol = Object.entries(LOCALE_CURRENCY_MAP).find(
      ([, info]) => info.currency === currencyCode
    )?.[1].symbol || "$";
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Format points to currency based on rate and locale
 */
export function formatPointsAsCurrency(
  points: number,
  rate: number,
  currencyCode: string = "USD",
  locale: string = "en-US"
): string {
  const amount = points * rate;
  return formatCurrency(amount, currencyCode, locale);
}

/**
 * Get available currencies as options for a select
 */
export function getCurrencyOptions(): Array<{ value: string; label: string }> {
  return Object.entries(CURRENCY_NAMES).map(([code, name]) => ({
    value: code,
    label: name,
  }));
}

/**
 * Get available locales as options for a select
 */
export function getLocaleOptions(): Array<{ value: string; label: string }> {
  return Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({
    value: code,
    label: name,
  }));
}

/**
 * Get currency symbol from currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const entry = Object.entries(LOCALE_CURRENCY_MAP).find(
    ([, info]) => info.currency === currencyCode
  );
  return entry?.[1].symbol || "$";
}
