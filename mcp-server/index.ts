#!/usr/bin/env node

/**
 * Byggesak MCP Server
 *
 * An MCP (Model Context Protocol) server that provides tools for looking up
 * building regulations and property information in Stavanger and Sandnes kommune.
 *
 * This server can be used with GitHub Copilot, Claude Desktop, or any other
 * MCP-compatible client.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Types for Kartverket API
interface AddressResult {
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

interface AddressSearchResponse {
  adresser: AddressResult[];
  metadata: {
    totaltAntallTreff: number;
  };
}

// Building regulations database
const regulations = {
  "frittliggende-bygg": {
    title: "Frittliggende bygg inntil 50 m²",
    description: "Garasje, bod, uthus eller lignende du kan bygge uten å søke",
    rules: [
      "Bygget er inntil 50 m² (BYA/BRA)",
      "Mønehøyde maks 4 meter",
      "Gesimshøyde maks 3 meter",
      "Avstand til nabogrense minst 1 meter",
      "Avstand til annet bygg på tomten minst 1 meter",
      "Bygget er i én etasje (kan ikke inneholde rom for varig opphold)",
      "Bygget må være i samsvar med reguleringsplanen",
    ],
    requirements: [
      "Sjekk reguleringsplanen for eiendommen",
      "Meld fra til kommunen innen 4 uker etter ferdigstillelse",
      "Sørg for at bygget ikke kommer i konflikt med ledninger/kabler i grunnen",
    ],
  },
  "tilbygg-15m2": {
    title: "Tilbygg inntil 15 m²",
    description: "Mindre tilbygg som ikke inneholder rom for varig opphold",
    rules: [
      "Tilbygget er inntil 15 m² (BYA/BRA)",
      "Det inneholder ikke rom for varig opphold (soverom, stue, kjøkken)",
      "Avstand til nabogrense er minst 4 meter",
      "Tilbygget er i samsvar med reguleringsplanen",
    ],
    examples: ["Inngangsparti", "Vindfang", "Bod", "Overbygget terrasse"],
    requirements: ["Meld fra til kommunen innen 4 uker etter ferdigstillelse"],
  },
  terrasse: {
    title: "Terrasse og platting",
    description: "Regler for utvendig terrasse uten tak",
    rules: [
      "Høyde fra terreng inntil 0,5 meter: Minst 1 meter fra nabogrense",
      "Høyde over 0,5 meter: Minst 4 meter fra nabogrense, eller søknad med nabosamtykke",
      "Må være i samsvar med reguleringsplanen",
    ],
  },
  "gjerde-levegg": {
    title: "Gjerde og levegg",
    description: "Regler for innhegning mot nabo og vei",
    rules: [
      "Gjerde (åpen konstruksjon): Inntil 1,5 meter høyt, kan bygges i nabogrense",
      "Levegg (tett): Inntil 1,8m høy og 10m lang, minst 1 meter fra nabogrense",
      "Levegg i nabogrense: Maks 1,8m høy og 5m lang",
      "Mot vei: Siktkrav ved avkjørsel må overholdes",
    ],
  },
};

// Create MCP server
const server = new Server(
  {
    name: "byggesak-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Define available tools
const tools: Tool[] = [
  {
    name: "search_address",
    description:
      "Søk etter en adresse i Stavanger eller Sandnes kommune. Returnerer eiendomsinformasjon inkludert gnr/bnr og koordinater.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'Adressen å søke etter (f.eks. "Løkkeveien 45, Stavanger")',
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_building_regulations",
    description:
      "Hent byggeregler og forskrifter for hva man kan bygge uten å søke og hva som krever søknad.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Kategori av byggeregulering",
          enum: [
            "frittliggende-bygg",
            "tilbygg-15m2",
            "terrasse",
            "gjerde-levegg",
            "alle",
          ],
        },
      },
      required: ["category"],
    },
  },
  {
    name: "check_building_allowed",
    description:
      "Sjekk om et spesifikt byggeprosjekt kan gjennomføres uten søknad basert på størrelse og avstand til nabogrense.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "Type bygg",
          enum: ["garasje", "bod", "tilbygg", "terrasse", "gjerde", "levegg"],
        },
        size_m2: {
          type: "number",
          description: "Størrelse i kvadratmeter",
        },
        distance_to_neighbor: {
          type: "number",
          description: "Avstand til nabogrense i meter",
        },
        height_m: {
          type: "number",
          description: "Høyde i meter (valgfri)",
        },
      },
      required: ["type", "size_m2", "distance_to_neighbor"],
    },
  },
  {
    name: "explain_regulation",
    description:
      "Forklar en byggeforskrift eller et begrep på en enkel og forståelig måte.",
    inputSchema: {
      type: "object",
      properties: {
        term: {
          type: "string",
          description:
            'Begrepet eller forskriften som skal forklares (f.eks. "BYA", "gesimshøyde", "reguleringsplan")',
        },
      },
      required: ["term"],
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "search_address": {
      const query = args?.query as string;
      if (!query) {
        return {
          content: [{ type: "text", text: "Mangler søkestreng for adresse" }],
        };
      }

      try {
        const params = new URLSearchParams({
          sok: query,
          fuzzy: "true",
          treffPerSide: "10",
        });

        const response = await fetch(
          `https://ws.geonorge.no/adresser/v1/sok?${params}`,
        );

        if (!response.ok) {
          throw new Error("Feil ved adressesøk");
        }

        const data: AddressSearchResponse = await response.json();

        // Filter to Stavanger (1103) and Sandnes (1108)
        const filteredAddresses = (data.adresser || []).filter(
          (addr) =>
            addr.kommunenummer === "1103" || addr.kommunenummer === "1108",
        );

        if (filteredAddresses.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Fant ingen adresse som matcher "${query}" i Stavanger eller Sandnes kommune.`,
              },
            ],
          };
        }

        const results = filteredAddresses.map((addr) => ({
          adresse: addr.adressetekst,
          poststed: `${addr.postnummer} ${addr.poststed}`,
          kommune: addr.kommunenavn,
          gnr_bnr: `${addr.gardsnummer}/${addr.bruksnummer}${addr.festenummer ? `/${addr.festenummer}` : ""}`,
          koordinater: {
            lat: addr.representasjonspunkt.lat,
            lon: addr.representasjonspunkt.lon,
          },
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Feil ved adressesøk: ${error instanceof Error ? error.message : "Ukjent feil"}`,
            },
          ],
        };
      }
    }

    case "get_building_regulations": {
      const category = args?.category as string;

      if (category === "alle") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(regulations, null, 2),
            },
          ],
        };
      }

      const reg = regulations[category as keyof typeof regulations];
      if (!reg) {
        return {
          content: [
            {
              type: "text",
              text: `Ukjent kategori: ${category}. Gyldige kategorier: ${Object.keys(regulations).join(", ")}, alle`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(reg, null, 2),
          },
        ],
      };
    }

    case "check_building_allowed": {
      const type = args?.type as string;
      const sizeM2 = args?.size_m2 as number;
      const distanceToNeighbor = args?.distance_to_neighbor as number;
      const heightM = args?.height_m as number | undefined;

      let allowed = false;
      let reasons: string[] = [];
      let requirements: string[] = [];

      switch (type) {
        case "garasje":
        case "bod":
          if (sizeM2 <= 50 && distanceToNeighbor >= 1) {
            allowed = true;
            reasons.push(
              "Bygget er under 50 m² og minst 1 meter fra nabogrense",
            );
            requirements.push(
              "Mønehøyde maks 4 meter, gesimshøyde maks 3 meter",
            );
            requirements.push(
              "Meld fra til kommunen innen 4 uker etter ferdigstillelse",
            );
          } else {
            if (sizeM2 > 50)
              reasons.push("Bygget er over 50 m² og krever søknad");
            if (distanceToNeighbor < 1)
              reasons.push("Avstand til nabogrense må være minst 1 meter");
          }
          break;

        case "tilbygg":
          if (sizeM2 <= 15 && distanceToNeighbor >= 4) {
            allowed = true;
            reasons.push(
              "Tilbygget er under 15 m² og minst 4 meter fra nabogrense",
            );
            requirements.push("Kan ikke inneholde rom for varig opphold");
            requirements.push(
              "Meld fra til kommunen innen 4 uker etter ferdigstillelse",
            );
          } else {
            if (sizeM2 > 15) reasons.push("Tilbygg over 15 m² krever søknad");
            if (distanceToNeighbor < 4)
              reasons.push(
                "Avstand til nabogrense må være minst 4 meter for tilbygg uten søknad",
              );
          }
          break;

        case "terrasse":
          const effectiveHeight = heightM ?? 0.3;
          if (effectiveHeight <= 0.5 && distanceToNeighbor >= 1) {
            allowed = true;
            reasons.push(
              "Terrassen er under 0,5 meter høy og minst 1 meter fra nabogrense",
            );
          } else if (effectiveHeight > 0.5 && distanceToNeighbor >= 4) {
            allowed = true;
            reasons.push(
              "Terrassen har tilstrekkelig avstand til nabogrense (4 meter for terrasser over 0,5m)",
            );
          } else {
            if (effectiveHeight > 0.5 && distanceToNeighbor < 4) {
              reasons.push(
                "Terrasser over 0,5 meter høye må være minst 4 meter fra nabogrense, eller krever søknad med nabosamtykke",
              );
            }
          }
          break;

        case "gjerde":
          const fenceHeight = heightM ?? 1.2;
          if (fenceHeight <= 1.5) {
            allowed = true;
            reasons.push("Gjerde inntil 1,5 meter kan bygges i nabogrense");
          } else {
            reasons.push("Gjerde over 1,5 meter krever søknad");
          }
          break;

        case "levegg":
          const wallHeight = heightM ?? 1.8;
          if (wallHeight <= 1.8) {
            if (distanceToNeighbor >= 1) {
              allowed = true;
              reasons.push(
                "Levegg inntil 1,8m høy og 10m lang kan bygges med 1 meter avstand til nabogrense",
              );
            } else if (distanceToNeighbor === 0 && sizeM2 <= 9) {
              // Approx 1.8m x 5m
              allowed = true;
              reasons.push(
                "Levegg inntil 1,8m høy og 5m lang kan bygges i nabogrense",
              );
            }
          } else {
            reasons.push("Levegg over 1,8 meter krever søknad");
          }
          break;
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                type,
                size_m2: sizeM2,
                distance_to_neighbor: distanceToNeighbor,
                height_m: heightM,
                allowed_without_application: allowed,
                reasons,
                requirements: allowed
                  ? requirements
                  : ["Krever byggesøknad til kommunen"],
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "explain_regulation": {
      const term = (args?.term as string)?.toLowerCase();

      const explanations: Record<string, string> = {
        bya: `**BYA (Bebygd Areal)** er et mål på hvor stor del av tomten som er bebygd. Det måles som fotavtrykket av alle bygninger sett ovenfra, inkludert:
- Grunnflaten av alle bygninger
- Overbygde arealer som carport
- Terrasser høyere enn 0,5 meter over bakken

Reguleringsplanen for din eiendom angir hvor stor BYA som er tillatt, ofte uttrykt i prosent av tomtearealet.`,

        gesimshøyde: `**Gesimshøyde** er høyden målt fra gjennomsnittlig ferdig planert terreng rundt bygningen og opp til skjæringen mellom ytterveggens ytre flate og takflaten.

Enkelt forklart: Det er høyden til der taket begynner. For et vanlig hus med skråtak er dette toppen av ytterveggen.`,

        mønehøyde: `**Mønehøyde** er høyden målt fra gjennomsnittlig ferdig planert terreng opp til mønet (det høyeste punktet på taket).

For hus med skråtak er dette toppen av taket. Reguleringsplaner setter ofte en maks mønehøyde for området.`,

        reguleringsplan: `**Reguleringsplan** er en detaljert arealplan som fastsetter hva som kan bygges i et område. Den inneholder:
- Hvilken type bebyggelse som er tillatt (bolig, næring, etc.)
- Maksimal utnyttelsesgrad (BYA)
- Maksimale høyder
- Byggegrenser
- Avstand til vei og nabogrense

Du finner reguleringsplanen for din eiendom på kommunens kartportal eller ved å kontakte kommunen.`,

        "plan- og bygningsloven": `**Plan- og bygningsloven** er den overordnede loven som regulerer all bygging i Norge. Den gir regler for:
- Hva som krever byggesøknad
- Hva du kan bygge uten å søke
- Nabovarsel og klagerett
- Kommunens behandling av byggesaker

Loven suppleres av forskrifter som TEK17 (Byggteknisk forskrift) og SAK10 (Byggesaksforskriften).`,

        tek17: `**TEK17** (Byggteknisk forskrift 2017) er forskriften som stiller krav til hvordan bygninger skal utformes og bygges. Den dekker:
- Krav til energibruk
- Brannsikkerhet
- Tilgjengelighet (universell utforming)
- Konstruksjonssikkerhet
- Inneklima

TEK17 gjelder for alle nye bygninger og vesentlige endringer.`,

        dispensasjon: `**Dispensasjon** er et unntak fra gjeldende regler. Du kan søke om dispensasjon hvis du ønsker å bygge noe som ikke er i samsvar med reguleringsplanen eller byggeforskriftene.

For å få dispensasjon må:
- Fordelene være klart større enn ulempene
- Det ikke vesentlig tilsidesette hensynene bak bestemmelsen

Dispensasjon behandles av kommunen og kan ta lengre tid enn vanlig byggesøknad.`,
      };

      // Find matching explanation
      let explanation = explanations[term];

      if (!explanation) {
        // Try fuzzy matching
        for (const [key, value] of Object.entries(explanations)) {
          if (term.includes(key) || key.includes(term)) {
            explanation = value;
            break;
          }
        }
      }

      if (!explanation) {
        return {
          content: [
            {
              type: "text",
              text: `Jeg har ikke en forklaring på "${term}" enda. Prøv å søke etter: ${Object.keys(explanations).join(", ")}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: explanation,
          },
        ],
      };
    }

    default:
      return {
        content: [
          {
            type: "text",
            text: `Ukjent verktøy: ${name}`,
          },
        ],
      };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Byggesak MCP Server started");
}

main().catch(console.error);
