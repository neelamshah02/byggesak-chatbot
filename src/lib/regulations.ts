/**
 * Building Regulations Database
 * Contains common regulations and rules for Stavanger/Sandnes
 */

export interface Regulation {
  id: string;
  title: string;
  description: string;
  category: "bygg-uten-soknad" | "soknadspliktig" | "regulering" | "generelt";
  municipalities: ("stavanger" | "sandnes" | "alle")[];
  details: string;
}

/**
 * Common building regulations for Stavanger and Sandnes
 * Based on Plan- og bygningsloven and TEK17
 */
export const regulations: Regulation[] = [
  {
    id: "frittliggende-bygg",
    title: "Frittliggende bygg inntil 50 m²",
    description: "Garasje, bod, uthus eller lignende",
    category: "bygg-uten-soknad",
    municipalities: ["alle"],
    details: `
**Du kan bygge uten å søke hvis:**
- Bygget er inntil 50 m² (BYA/BRA)
- Mønehøyde maks 4 meter
- Gesimshøyde maks 3 meter
- Avstand til nabogrense minst 1 meter
- Avstand til annet bygg på tomten minst 1 meter
- Bygget er i én etasje (kan ikke inneholde rom for varig opphold)
- Bygget er i samsvar med reguleringsplanen

**Du må:**
- Sjekke reguleringsplanen for eiendommen
- Melde fra til kommunen innen 4 uker etter ferdigstillelse
- Sørge for at bygget ikke kommer i konflikt med ledninger/kabler i grunnen
    `,
  },
  {
    id: "tilbygg-15m2",
    title: "Tilbygg inntil 15 m²",
    description: "Mindre tilbygg som ikke inneholder rom for varig opphold",
    category: "bygg-uten-soknad",
    municipalities: ["alle"],
    details: `
**Du kan bygge tilbygg uten å søke hvis:**
- Tilbygget er inntil 15 m² (BYA/BRA)
- Det ikke inneholder rom for varig opphold (soverom, stue, kjøkken)
- Avstand til nabogrense er minst 4 meter
- Tilbygget er i samsvar med reguleringsplanen

**Eksempler på hva som kan bygges:**
- Inngangsparti
- Vindfang
- Bod
- Overbygget terrasse

**Du må:**
- Melde fra til kommunen innen 4 uker etter ferdigstillelse
    `,
  },
  {
    id: "terrasse",
    title: "Terrasse og platting",
    description: "Utvendig terrasse uten tak",
    category: "bygg-uten-soknad",
    municipalities: ["alle"],
    details: `
**Du kan bygge platting/terrasse uten å søke hvis:**
- Høyde fra terreng er inntil 0,5 meter
- Avstand til nabogrense er minst 1 meter
- Plattingen er i samsvar med reguleringsplanen

**For terrasser høyere enn 0,5 meter:**
- Må være minst 4 meter fra nabogrense
- Eller du må søke med samtykke fra nabo
    `,
  },
  {
    id: "gjerde",
    title: "Gjerde og levegg",
    description: "Innhegning mot nabo og vei",
    category: "bygg-uten-soknad",
    municipalities: ["alle"],
    details: `
**Gjerde (åpen konstruksjon):**
- Kan bygges i nabogrense uten å søke
- Inntil 1,5 meter høyt

**Levegg (tett konstruksjon):**
- Inntil 1,8 meter høy og 10 meter lang
- Avstand til nabogrense minst 1 meter
- Eller inntil 1,8 meter høy og 5 meter lang i nabogrense

**Mot vei:**
- Siktkrav ved avkjørsel må overholdes
- Sjekk kommunens regler for gjerde mot offentlig vei
    `,
  },
  {
    id: "soknadspliktig-tilbygg",
    title: "Større tilbygg (over 15 m²)",
    description: "Tilbygg som krever søknad",
    category: "soknadspliktig",
    municipalities: ["alle"],
    details: `
**Du må søke for tilbygg hvis:**
- Tilbygget er over 15 m²
- Det skal inneholde rom for varig opphold
- Avstand til nabogrense er under 4 meter

**Søknadsprosessen:**
1. **Uten ansvarsrett** (søke selv):
   - For enklere tilbygg uten egen boenhet
   - Du tar selv ansvar for at reglene følges

2. **Med ansvarsrett** (ansvarlig foretak):
   - For komplekse tilbygg
   - Krever kvalifisert foretak

**Typisk behandlingstid:** 3-12 uker
    `,
  },
  {
    id: "utnyttelsesgrad",
    title: "Utnyttelsesgrad (BYA)",
    description: "Hvor mye av tomten som kan bebygges",
    category: "regulering",
    municipalities: ["alle"],
    details: `
**Bebygd areal (BYA):**
- Angir hvor stor andel av tomten som kan bebygges
- Typisk 20-40% i boligområder

**Hva teller med i BYA:**
- Grunnflate av alle bygninger
- Overbygde arealer (carport, overbygget terrasse)
- Terrasser høyere enn 0,5 meter over terreng

**Sjekk reguleringsplanen:**
- BYA varierer mellom områder
- Eldre planer kan ha andre beregningsregler
    `,
  },
  {
    id: "byggegrense",
    title: "Byggegrense",
    description: "Avstand til vei og nabogrense",
    category: "regulering",
    municipalities: ["alle"],
    details: `
**Avstand til nabogrense:**
- Hovedregel: 4 meter for bygninger
- 1 meter for garasje, bod under 50 m²
- 0 meter krever samtykke fra nabo og dispensasjon

**Avstand til vei:**
- Fastsettes i reguleringsplan
- Ofte 4-15 meter fra veikant
- Gjelder også for garasjer og carporter

**Frisiktlinjer:**
- Ved avkjørsel og kryss
- Ingen bygninger, gjerder over 0,5m, hekker
    `,
  },
  {
    id: "hoyde",
    title: "Høydebestemmelser",
    description: "Maks høyde på bygninger",
    category: "regulering",
    municipalities: ["alle"],
    details: `
**Gesimshøyde:**
- Måles fra gjennomsnittlig terrengnivå til gesims
- Typisk maks 8-9 meter i boligområder

**Mønehøyde:**
- Måles fra gjennomsnittlig terrengnivå til møne
- Typisk maks 9-10 meter i boligområder

**Sjekk reguleringsplanen:**
- Høyder varierer mellom områder
- Noen planer tillater flat tak, andre krever saltak
    `,
  },
];

/**
 * Get regulations that might apply to a specific query
 */
export function findRelevantRegulations(query: string): Regulation[] {
  const lowercaseQuery = query.toLowerCase();

  const keywords: Record<string, string[]> = {
    "frittliggende-bygg": [
      "garasje",
      "bod",
      "uthus",
      "anneks",
      "50 m",
      "50m",
      "frittliggende",
    ],
    "tilbygg-15m2": [
      "tilbygg",
      "utvide",
      "bygge på",
      "15 m",
      "15m",
      "vindfang",
    ],
    terrasse: ["terrasse", "platting", "veranda", "balkong"],
    gjerde: ["gjerde", "levegg", "stakitt", "hekk", "innhegning"],
    "soknadspliktig-tilbygg": ["søknad", "søke", "tilbygg", "større"],
    utnyttelsesgrad: [
      "bya",
      "bebygd areal",
      "utnyttelsesgrad",
      "tomt",
      "prosent",
    ],
    byggegrense: ["avstand", "grense", "nabo", "vei", "meter fra"],
    hoyde: ["høyde", "etasje", "gesims", "møne", "tak"],
  };

  const matches: Regulation[] = [];

  for (const [id, words] of Object.entries(keywords)) {
    if (words.some((word) => lowercaseQuery.includes(word))) {
      const regulation = regulations.find((r) => r.id === id);
      if (regulation) {
        matches.push(regulation);
      }
    }
  }

  // If no specific match, return general info
  if (matches.length === 0) {
    return regulations
      .filter((r) => r.category === "bygg-uten-soknad")
      .slice(0, 2);
  }

  return matches;
}

/**
 * Format regulations for display
 */
export function formatRegulations(regs: Regulation[]): string {
  return regs.map((r) => `## ${r.title}\n\n${r.details}`).join("\n\n---\n\n");
}
