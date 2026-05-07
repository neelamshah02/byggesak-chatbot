/**
 * Kartverket Address API Integration
 * Uses the free Geonorge address search API
 * Documentation: https://ws.geonorge.no/adresser/v1/
 */

export interface AddressResult {
  adressetekst: string;
  poststed: string;
  postnummer: string;
  kommunenavn: string;
  kommunenummer: string;
  gardsnummer: number;
  bruksnummer: number;
  festenummer?: number;
  representasjonspunkt: {
    lat: number;
    lon: number;
  };
}

export interface AddressSearchResponse {
  adresser: AddressResult[];
  metadata: {
    totaltAntallTreff: number;
  };
}

/**
 * Search for addresses using Kartverket's address API
 */
export async function searchAddress(query: string): Promise<AddressResult[]> {
  const params = new URLSearchParams({
    sok: query,
    fuzzy: "true",
    treffPerSide: "10",
  });

  const response = await fetch(
    `https://ws.geonorge.no/adresser/v1/sok?${params}`,
  );

  if (!response.ok) {
    throw new Error("Failed to search address");
  }

  const data: AddressSearchResponse = await response.json();

  // Filter to Stavanger (1103) and Sandnes (1108) only
  const filteredAddresses = (data.adresser || []).filter(
    (addr) => addr.kommunenummer === "1103" || addr.kommunenummer === "1108",
  );

  return filteredAddresses;
}

/**
 * Get property information from address
 */
export function formatPropertyInfo(address: AddressResult): string {
  return `
**Eiendomsinformasjon:**
- **Adresse:** ${address.adressetekst}
- **Poststed:** ${address.postnummer} ${address.poststed}
- **Kommune:** ${address.kommunenavn}
- **Gnr/Bnr:** ${address.gardsnummer}/${address.bruksnummer}${address.festenummer ? `/${address.festenummer}` : ""}
- **Koordinater:** ${address.representasjonspunkt.lat.toFixed(6)}, ${address.representasjonspunkt.lon.toFixed(6)}
  `.trim();
}

/**
 * Check if input looks like an address
 */
export function looksLikeAddress(input: string): boolean {
  // Common patterns for Norwegian addresses
  const addressPatterns = [
    /\d+[a-z]?\s*,?\s*(stavanger|sandnes)/i,
    /veien|gata|gate|vei|plass|torget|brygge|alle|stien/i,
    /^\d{4}\s+\w+/i, // Postal code pattern
  ];

  return addressPatterns.some((pattern) => pattern.test(input));
}

/**
 * Extract just the address portion from a mixed message.
 * e.g. "Steinstemveien 26 Sandnes. What can I build?" -> "Steinstemveien 26 Sandnes"
 * Returns the original string if no address boundary is found.
 */
export function extractAddressPart(input: string): string {
  // Split at sentence-ending punctuation followed by a question/statement
  const boundary = /[.?!]\s+/;
  const match = boundary.exec(input);
  if (match) {
    return input.slice(0, match.index).trim();
  }
  return input.trim();
}
