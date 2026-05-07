import { NextRequest, NextResponse } from "next/server";
import {
  searchAddress,
  formatPropertyInfo,
  looksLikeAddress,
} from "@/lib/kartverket";
import { findRelevantRegulations, formatRegulations } from "@/lib/regulations";
import {
  findAreaRegulations,
  formatAreaRegulations,
  getRegulationLookupLinks,
} from "@/lib/area-regulations";
import {
  findApplicableGuides,
  formatGuides,
  formatFooterCTA,
} from "@/lib/application-guides";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Simple AI-like response generation
 * For production, replace with actual LLM integration (OpenAI, Anthropic, etc.)
 */
async function generateResponse(
  messages: Message[],
  context: {
    addressInfo?: string;
    areaInfo?: string;
    lookupLinks?: string;
    regulations?: string;
    guides?: string;
    footerCTA?: string;
  },
): Promise<string> {
  const lastMessage = messages[messages.length - 1].content;

  // If we have address context, include it
  if (context.addressInfo) {
    let response = context.addressInfo + "\n\n";

    // Add area-specific regulations if found
    if (context.areaInfo) {
      response += "---\n\n" + context.areaInfo + "\n\n";
    }

    // Add relevant general regulations based on the query
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

    // Inject application guides if any
    if (context.guides) {
      response += context.guides;
    }

    // Add lookup links
    if (context.lookupLinks) {
      response += "\n\n---\n\n" + context.lookupLinks;
    }

    // Add footer CTA
    if (context.footerCTA) {
      response += context.footerCTA;
    }

    return response;
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

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;
    let context: {
      addressInfo?: string;
      areaInfo?: string;
      lookupLinks?: string;
      regulations?: string;
      guides?: string;
      footerCTA?: string;
    } = {};

    // Check if the message looks like an address
    if (looksLikeAddress(lastMessage)) {
      try {
        const addresses = await searchAddress(lastMessage);

        if (addresses.length > 0) {
          const address = addresses[0];
          context.addressInfo = formatPropertyInfo(address);

          // Look up area-specific regulations
          const areaReg = findAreaRegulations(address.adressetekst, {
            lat: address.representasjonspunkt.lat,
            lon: address.representasjonspunkt.lon,
          });

          if (areaReg) {
            context.areaInfo = formatAreaRegulations(areaReg);
          }

          // Add lookup links
          context.lookupLinks = getRegulationLookupLinks(
            address.kommunenavn,
            address.gardsnummer,
            address.bruksnummer,
          );

          // Detect conflicts and build guides
          const guides = findApplicableGuides(lastMessage, areaReg ?? undefined);
          if (guides.length > 0) {
            context.guides = formatGuides(guides, address.kommunenavn);
          }
          context.footerCTA = formatFooterCTA().trimStart().replace(/^---\n/, "");
        } else {
          context.addressInfo = `
Jeg fant dessverre ingen adresse som matcher "${lastMessage}" i Stavanger eller Sandnes kommune.

**Tips:**
- Sjekk stavingen
- Inkluder gate/vei-navn og husnummer
- Prøv å legge til kommunenavn (f.eks. "Stavanger" eller "Sandnes")
          `;
        }
      } catch (error) {
        console.error("Address search error:", error);
        context.addressInfo = `
Det oppstod en feil ved søk etter adressen. Vennligst prøv igjen.
        `;
      }
    }

    const response = await generateResponse(messages, context);

    return NextResponse.json({ content: response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
