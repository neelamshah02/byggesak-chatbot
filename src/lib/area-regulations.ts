/**
 * Area-specific building regulations for Stavanger and Sandnes
 *
 * This database contains known regulations for specific neighborhoods/areas.
 * Data is based on common reguleringsplaner in these kommuner.
 */

export interface AreaRegulation {
  id: string;
  areaName: string;
  kommune: "stavanger" | "sandnes";
  planId?: string;
  nationalPlanId?: string; // Nasjonal arealplanid (e.g., "1108_202005")
  planName?: string;
  planType?: string; // Plantype (e.g., "Kommuneplanens arealdel")
  legalReference?: string; // Lovreferanse
  caseNumber?: string; // Saksnummer
  streetPatterns: string[]; // Regex patterns to match street names
  coordinates?: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  regulations: {
    maxBYA?: string; // e.g., "30%" or "BYA=30%"
    maxHeight?: string;
    maxFloors?: string;
    buildingType?: string;
    roofType?: string;
    minPlotSize?: string;
    parkering?: string;
    other?: string[];
  };
  planDocumentUrl?: string;
  lastUpdated: string;
}

/**
 * Database of area-specific regulations
 * Note: This is sample data - actual regulations must be verified with kommune
 */
export const areaRegulations: AreaRegulation[] = [
  // SANDNES AREAS
  {
    id: "sandnes-lura",
    areaName: "Lura",
    kommune: "sandnes",
    planId: "202005",
    nationalPlanId: "1108_202005",
    planName: "Kommuneplanens arealdel",
    planType: "Kommuneplanens arealdel",
    legalReference: "Plan- og bygningsloven av 2008",
    caseNumber: "2022/139",
    streetPatterns: ["steinstem", "lura", "luravegen", "luramyrveien"],
    coordinates: {
      minLat: 58.865,
      maxLat: 58.88,
      minLon: 5.715,
      maxLon: 5.735,
    },
    regulations: {
      maxBYA: "25-30%",
      maxHeight: "Gesims 6m, møne 9m",
      maxFloors: "2 etasjer + kjeller",
      buildingType: "Frittliggende småhusbebyggelse",
      roofType: "Saltak med takvinkel 22-35°",
      minPlotSize: "600 m²",
      parkering: "2 plasser per boenhet",
      other: [
        "Garasje/carport maks 50 m²",
        "Maks 1 boenhet per tomt (sekundærleilighet kan tillates)",
        "Byggegrense 4m fra vei, 4m fra nabogrense",
      ],
    },
    planDocumentUrl:
      "https://www.sandnes.kommune.no/plan-bygg-og-eiendom/kommuneplan-og-arealplaner/",
    lastUpdated: "2024-01-15",
  },
  {
    id: "sandnes-austratt",
    areaName: "Austrått",
    kommune: "sandnes",
    streetPatterns: ["austrått", "austråttveien", "austrått"],
    regulations: {
      maxBYA: "25-30%",
      maxHeight: "Gesims 6m, møne 9m",
      maxFloors: "2 etasjer + kjeller",
      buildingType: "Frittliggende småhusbebyggelse",
      parkering: "2 plasser per boenhet",
    },
    planDocumentUrl:
      "https://www.sandnes.kommune.no/plan-bygg-og-eiendom/kommuneplan-og-arealplaner/",
    lastUpdated: "2024-01-15",
  },
  {
    id: "sandnes-ganddal",
    areaName: "Ganddal",
    kommune: "sandnes",
    planId: "2018102",
    planName: "Områderegulering Ganddal",
    streetPatterns: ["ganddal", "ganddalsvegen"],
    regulations: {
      maxBYA: "30-35%",
      maxHeight: "Gesims 7m, møne 10m",
      maxFloors: "2-3 etasjer",
      buildingType: "Småhusbebyggelse og rekkehus",
      parkering: "1.5-2 plasser per boenhet",
    },
    planDocumentUrl:
      "https://www.sandnes.kommune.no/plan-bygg-og-eiendom/kommuneplan-og-arealplaner/",
    lastUpdated: "2024-01-15",
  },
  {
    id: "sandnes-sentrum",
    areaName: "Sandnes Sentrum",
    kommune: "sandnes",
    planId: "2014108",
    planName: "Sentrumsplanen",
    streetPatterns: ["langgata", "oalsgata", "elvegata", "storgata"],
    regulations: {
      maxBYA: "80-100%",
      maxHeight: "Varierer 12-21m",
      maxFloors: "3-6 etasjer",
      buildingType: "Sentrumsbebyggelse - kombinert formål",
      parkering: "Felles parkeringsanlegg",
      other: [
        "Næring/handel i 1. etasje påkrevd i sentrale strøk",
        "Krav til uteoppholdsareal",
      ],
    },
    planDocumentUrl:
      "https://www.sandnes.kommune.no/plan-bygg-og-eiendom/kommuneplan-og-arealplaner/",
    lastUpdated: "2024-01-15",
  },

  // STAVANGER AREAS
  {
    id: "stavanger-eiganes",
    areaName: "Eiganes og Våland",
    kommune: "stavanger",
    planId: "1901",
    planName: "Kommunedelplan Eiganes/Våland",
    streetPatterns: ["eiganes", "våland", "madlaveien", "løkkeveien"],
    regulations: {
      maxBYA: "25-35%",
      maxHeight: "Gesims 6m, møne 9m",
      maxFloors: "2 etasjer",
      buildingType: "Villabebyggelse - verneverdig område",
      roofType: "Skal tilpasses eksisterende bebyggelse",
      other: [
        "Strenge krav til tilpasning til eksisterende miljø",
        "Kulturminnevern kan gi begrensninger",
        "Fasadeendringer krever ofte søknad",
      ],
    },
    planDocumentUrl:
      "https://www.stavanger.kommune.no/samfunnsutvikling/planer/",
    lastUpdated: "2024-01-15",
  },
  {
    id: "stavanger-hundvag",
    areaName: "Hundvåg",
    kommune: "stavanger",
    planId: "2582",
    planName: "Kommunedelplan Hundvåg",
    streetPatterns: ["hundvåg", "austbø", "sølyst"],
    regulations: {
      maxBYA: "25-30%",
      maxHeight: "Gesims 6m, møne 8m",
      maxFloors: "2 etasjer",
      buildingType: "Småhusbebyggelse",
      parkering: "2 plasser per boenhet",
    },
    planDocumentUrl:
      "https://www.stavanger.kommune.no/samfunnsutvikling/planer/",
    lastUpdated: "2024-01-15",
  },
  {
    id: "stavanger-storhaug",
    areaName: "Storhaug",
    kommune: "stavanger",
    planId: "2650",
    planName: "Kommunedelplan Storhaug",
    streetPatterns: ["storhaug", "badedammen", "lervig"],
    regulations: {
      maxBYA: "40-60%",
      maxHeight: "Varierer 9-15m",
      maxFloors: "2-4 etasjer",
      buildingType: "Bymessig bebyggelse",
      other: [
        "Transformasjonsområde - mye nybygging",
        "Varierende krav etter delområde",
      ],
    },
    planDocumentUrl:
      "https://www.stavanger.kommune.no/samfunnsutvikling/planer/",
    lastUpdated: "2024-01-15",
  },
  {
    id: "stavanger-madla",
    areaName: "Madla",
    kommune: "stavanger",
    planId: "2501",
    planName: "Kommunedelplan Madla-Revheim",
    streetPatterns: ["madla", "revheim", "kvernevik"],
    regulations: {
      maxBYA: "25-30%",
      maxHeight: "Gesims 6m, møne 9m",
      maxFloors: "2 etasjer",
      buildingType: "Småhusbebyggelse",
      minPlotSize: "500-700 m²",
      parkering: "2 plasser per boenhet",
    },
    planDocumentUrl:
      "https://www.stavanger.kommune.no/samfunnsutvikling/planer/",
    lastUpdated: "2024-01-15",
  },
];

/**
 * Find area regulations by street name
 */
export function findAreaByStreet(streetName: string): AreaRegulation | null {
  const normalizedStreet = streetName.toLowerCase().replace(/[^a-zæøå]/g, "");

  for (const area of areaRegulations) {
    for (const pattern of area.streetPatterns) {
      if (normalizedStreet.includes(pattern.toLowerCase())) {
        return area;
      }
    }
  }

  return null;
}

/**
 * Find area regulations by coordinates
 */
export function findAreaByCoordinates(
  lat: number,
  lon: number,
): AreaRegulation | null {
  for (const area of areaRegulations) {
    if (area.coordinates) {
      const { minLat, maxLat, minLon, maxLon } = area.coordinates;
      if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
        return area;
      }
    }
  }

  return null;
}

/**
 * Find area regulations by street name or coordinates
 */
export function findAreaRegulations(
  streetName: string,
  coordinates?: { lat: number; lon: number },
): AreaRegulation | null {
  // First try by street name
  const byStreet = findAreaByStreet(streetName);
  if (byStreet) return byStreet;

  // Then try by coordinates
  if (coordinates) {
    return findAreaByCoordinates(coordinates.lat, coordinates.lon);
  }

  return null;
}

/**
 * Format area regulations for display
 */
export function formatAreaRegulations(area: AreaRegulation): string {
  const regs = area.regulations;

  let output = `## Områderegler for ${area.areaName}\n\n`;

  // Plan information
  if (area.planName) {
    output += `**Plan:** ${area.planName}\n`;
  }
  if (area.planType && area.planType !== area.planName) {
    output += `**Plantype:** ${area.planType}\n`;
  }
  if (area.nationalPlanId) {
    output += `**Nasjonal arealplan-ID:** ${area.nationalPlanId}\n`;
  }
  if (area.planId) {
    output += `**Plan-ID:** ${area.planId}\n`;
  }
  if (area.caseNumber) {
    output += `**Saksnummer:** ${area.caseNumber}\n`;
  }
  if (area.legalReference) {
    output += `**Lovreferanse:** ${area.legalReference}\n`;
  }
  output += `\n`;

  output += `**Spesifikke regler for dette området:**\n\n`;

  if (regs.maxBYA) output += `- **Maks utnyttelse (BYA):** ${regs.maxBYA}\n`;
  if (regs.maxHeight) output += `- **Maks høyde:** ${regs.maxHeight}\n`;
  if (regs.maxFloors) output += `- **Etasjer:** ${regs.maxFloors}\n`;
  if (regs.buildingType)
    output += `- **Bebyggelsestype:** ${regs.buildingType}\n`;
  if (regs.roofType) output += `- **Takform:** ${regs.roofType}\n`;
  if (regs.minPlotSize)
    output += `- **Min. tomtestørrelse:** ${regs.minPlotSize}\n`;
  if (regs.parkering) output += `- **Parkering:** ${regs.parkering}\n`;

  if (regs.other && regs.other.length > 0) {
    output += `\n**Andre bestemmelser:**\n`;
    for (const item of regs.other) {
      output += `- ${item}\n`;
    }
  }

  output += `\n---\n\n`;
  output += `⚠️ **Viktig:** Dette er veiledende informasjon. `;
  output += `Sjekk alltid den gjeldende reguleringsplanen for nøyaktige bestemmelser.\n\n`;

  if (area.planDocumentUrl) {
    output += `📋 **Se offisielle plandokumenter:** [${area.kommune === "sandnes" ? "Sandnes" : "Stavanger"} kommune planregister](${area.planDocumentUrl})\n`;
  }

  // Add direct link to Se Eiendom for the property
  output += `\n🗺️ **Se eiendomsinfo:** [Se Eiendom (Kartverket)](https://seeiendom.kartverket.no/)\n`;

  return output;
}

/**
 * Get links to look up regulations for a property
 */
export function getRegulationLookupLinks(
  kommune: string,
  gnr: number,
  bnr: number,
): string {
  const kommuneNorm = kommune.toLowerCase();

  let links = `## Slå opp reguleringsplan for din eiendom\n\n`;
  links += `**Gnr/Bnr:** ${gnr}/${bnr}\n\n`;

  // Direct link to arealplaner.no with property lookup
  if (kommuneNorm === "sandnes") {
    const arealplanerUrl = `https://arealplaner.no/sandnes1108/arealplaner/search?knr=1108&gnr=${gnr}&bnr=${bnr}`;
    links += `### 📋 Reguleringsplaner for eiendommen:\n`;
    links += `- [**Se alle reguleringsplaner for Gnr ${gnr}/Bnr ${bnr}**](${arealplanerUrl})\n\n`;
    links += `### Sandnes kommune:\n`;
    links += `- [Kommunekart Sandnes](https://kommunekart.com/klient/sandnes)\n`;
    links += `- [Sandnes planregister](https://www.sandnes.kommune.no/plan-bygg-og-eiendom/kommuneplan-og-arealplaner/)\n`;
    links += `- [Innsyn byggesak](https://www.sandnes.kommune.no/plan-bygg-og-eiendom/byggesak/)\n`;
  } else if (kommuneNorm === "stavanger") {
    const arealplanerUrl = `https://arealplaner.no/stavanger1103/arealplaner/search?knr=1103&gnr=${gnr}&bnr=${bnr}`;
    links += `### 📋 Reguleringsplaner for eiendommen:\n`;
    links += `- [**Se alle reguleringsplaner for Gnr ${gnr}/Bnr ${bnr}**](${arealplanerUrl})\n\n`;
    links += `### Stavanger kommune:\n`;
    links += `- [Kommunekart Stavanger](https://kommunekart.com/klient/stavanger)\n`;
    links += `- [Stavanger planregister](https://www.stavanger.kommune.no/samfunnsutvikling/planer/)\n`;
    links += `- [Innsyn byggesak](https://www.stavanger.kommune.no/bolig-og-bygg/byggesak/)\n`;
  }

  links += `\n### Nasjonale tjenester:\n`;
  links += `- [Se Eiendom (Kartverket)](https://seeiendom.kartverket.no/) - Gratis eiendomsinfo\n`;
  links += `- [Norgeskart](https://norgeskart.no/) - Kart med reguleringsplaner\n`;

  return links;
}
