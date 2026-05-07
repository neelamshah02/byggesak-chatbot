/**
 * Client-side chat service for GitHub Pages deployment
 * This replaces the server-side API route
 */

import {
  searchAddress,
  formatPropertyInfo,
  looksLikeAddress,
  extractAddressPart,
} from "./kartverket";
import { findRelevantRegulations, formatRegulations } from "./regulations";
import {
  findAreaRegulations,
  formatAreaRegulations,
  getRegulationLookupLinks,
} from "./area-regulations";
import {
  findApplicableGuides,
  formatGuides,
  formatFooterCTA,
} from "./application-guides";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Process chat messages and generate response (client-side)
 */
export async function generateChatResponse(
  messages: Message[],
): Promise<string> {
  const lastMessage = messages[messages.length - 1].content;

  // Check if the message looks like an address
  if (looksLikeAddress(lastMessage)) {
    try {
      const addressQuery = extractAddressPart(lastMessage);
      const addresses = await searchAddress(addressQuery);

      if (addresses.length > 0) {
        const address = addresses[0];
        let response = formatPropertyInfo(address) + "\n\n";

        // Look up area-specific regulations
        const areaReg = findAreaRegulations(address.adressetekst, {
          lat: address.representasjonspunkt.lat,
          lon: address.representasjonspunkt.lon,
        });

        if (areaReg) {
          response += "---\n\n" + formatAreaRegulations(areaReg) + "\n\n";
        }

        // Add relevant general regulations
        const regs = findRelevantRegulations(lastMessage);
        if (regs.length > 0) {
          response += "---\n\n**Generelle byggeregler som også gjelder:**\n\n";
          response += formatRegulations(regs);
        } else {
          response += `
**Hva vil du vite mer om?**
- Hva du kan bygge uten å søke
- Tilbygg og påbygg
- Garasje eller bod
- Terrasse og platting
- Gjerde og levegg
- Søknadsprosessen
          `;
        }

        // Detect conflicts and inject application guides
        const guides = findApplicableGuides(lastMessage, areaReg ?? undefined);
        if (guides.length > 0) {
          response += formatGuides(guides, address.kommunenavn);
        }

        // Add lookup links and footer CTA
        response +=
          "\n\n---\n\n" +
          getRegulationLookupLinks(
            address.kommunenavn,
            address.gardsnummer,
            address.bruksnummer,
          );
        response += formatFooterCTA().trimStart().replace(/^---\n/, "");

        return response;
      } else {
        return `
Jeg fant dessverre ingen adresse som matcher "${lastMessage}" i Stavanger eller Sandnes kommune.

**Tips:**
- Sjekk stavingen
- Inkluder gate/vei-navn og husnummer
- Prøv å legge til kommunenavn (f.eks. "Stavanger" eller "Sandnes")
        `;
      }
    } catch (error) {
      console.error("Address search error:", error);
      return "Det oppstod en feil ved søk etter adressen. Vennligst prøv igjen.";
    }
  }

  // Handle common questions without address
  const lowercaseMessage = lastMessage.toLowerCase();

  if (
    lowercaseMessage.includes("uten å søke") ||
    lowercaseMessage.includes("uten søknad")
  ) {
    const regs = findRelevantRegulations("frittliggende garasje tilbygg");
    return `
**Hva du kan bygge uten å søke:**

${formatRegulations(regs)}

---

**Viktig:**
For å gi deg nøyaktig informasjon om hva du kan bygge, trenger jeg adressen til eiendommen din. Skriv inn adressen (f.eks. "Steinstemveien 26, Sandnes").

${formatFooterCTA()}
    `;
  }

  if (
    lowercaseMessage.includes("tilbygg") ||
    lowercaseMessage.includes("påbygg")
  ) {
    const regs = findRelevantRegulations("tilbygg søknad");
    return formatRegulations(regs) + `\n\n${formatFooterCTA()}`;
  }

  if (
    lowercaseMessage.includes("garasje") ||
    lowercaseMessage.includes("bod") ||
    lowercaseMessage.includes("uthus")
  ) {
    const regs = findRelevantRegulations("garasje frittliggende");
    return formatRegulations(regs) + `\n\n${formatFooterCTA()}`;
  }

  if (
    lowercaseMessage.includes("terrasse") ||
    lowercaseMessage.includes("platting")
  ) {
    const regs = findRelevantRegulations("terrasse");
    return formatRegulations(regs) + `\n\n${formatFooterCTA()}`;
  }

  if (
    lowercaseMessage.includes("gjerde") ||
    lowercaseMessage.includes("levegg")
  ) {
    const regs = findRelevantRegulations("gjerde");
    return formatRegulations(regs) + `\n\n${formatFooterCTA()}`;
  }

  if (
    lowercaseMessage.includes("søke") ||
    lowercaseMessage.includes("søknad")
  ) {
    return `
**Søknadsprosessen for byggesaker:**

**1. Sjekk om tiltaket er søknadspliktig**
Mange mindre tiltak kan gjøres uten å søke. Se oversikten over hva du kan bygge uten søknad.

**2. Velg riktig søknadstype**
- **Uten ansvarsrett:** Du søker selv og tar ansvar for at reglene følges
- **Med ansvarsrett:** Et ansvarlig foretak søker for deg

**3. Forbered søknaden**
Du trenger vanligvis:
- Situasjonskart (kan lastes ned fra kommunens kartportal)
- Tegninger (plan, snitt, fasader)
- Nabovarsling
- Eventuell dispensasjonssøknad

**4. Send inn søknad**
- Stavanger: [Søk digitalt via eByggesøk](https://www.stavanger.kommune.no/byggesak/soknad/)
- Sandnes: [Søk digitalt via eByggesøk](https://www.sandnes.kommune.no/tjenester/byggesak/soknad/)

**Behandlingstid:**
- 3 uker for enkle tiltak
- 12 uker for mer komplekse saker

**Skriv inn adressen din for å få mer spesifikk informasjon om hva som gjelder for din eiendom.**
${formatFooterCTA()}
    `;
  }

  // Default response
  return `
Jeg forstår at du lurer på noe om byggesaker. For å kunne hjelpe deg best mulig, ber jeg deg om å:

1. **Oppgi adressen din** - Da kan jeg finne informasjon om eiendommen og gjeldende regler
2. **Eller still et konkret spørsmål** om for eksempel:
   - Hva du kan bygge uten å søke
   - Regler for garasje eller bod
   - Tilbygg og påbygg
   - Terrasse og platting
   - Gjerde og levegg
   - Søknadsprosessen

Prøv for eksempel: *"Steinstemveien 26, Sandnes"* eller *"Hva kan jeg bygge uten å søke?"*
  `;
}
