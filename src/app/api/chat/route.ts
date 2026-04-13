import { NextRequest, NextResponse } from "next/server";
import {
  searchAddress,
  formatPropertyInfo,
  looksLikeAddress,
} from "@/lib/kartverket";
import { findRelevantRegulations, formatRegulations } from "@/lib/regulations";

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
    regulations?: string;
  },
): Promise<string> {
  const lastMessage = messages[messages.length - 1].content;

  // If we have address context, include it
  if (context.addressInfo) {
    let response = context.addressInfo + "\n\n";

    // Add relevant regulations based on the query
    const regs = findRelevantRegulations(lastMessage);
    if (regs.length > 0) {
      response += "---\n\n**Relevante byggeregler for denne eiendommen:**\n\n";
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

    response +=
      "\n\n*Merk: For eksakte regler, sjekk alltid den gjeldende reguleringsplanen for eiendommen på kommunens nettsider.*";

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
For å gi deg nøyaktig informasjon om hva du kan bygge, trenger jeg adressen til eiendommen din. Skriv inn adressen (f.eks. "Løkkeveien 45, Stavanger").
    `;
  }

  if (
    lowercaseMessage.includes("tilbygg") ||
    lowercaseMessage.includes("påbygg")
  ) {
    const regs = findRelevantRegulations("tilbygg søknad");
    return formatRegulations(regs);
  }

  if (
    lowercaseMessage.includes("garasje") ||
    lowercaseMessage.includes("bod") ||
    lowercaseMessage.includes("uthus")
  ) {
    const regs = findRelevantRegulations("garasje frittliggende");
    return formatRegulations(regs);
  }

  if (
    lowercaseMessage.includes("terrasse") ||
    lowercaseMessage.includes("platting")
  ) {
    const regs = findRelevantRegulations("terrasse");
    return formatRegulations(regs);
  }

  if (
    lowercaseMessage.includes("gjerde") ||
    lowercaseMessage.includes("levegg")
  ) {
    const regs = findRelevantRegulations("gjerde");
    return formatRegulations(regs);
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
- Stavanger: [Søk digitalt via eByggesøk](https://www.stavanger.kommune.no/byggesok)
- Sandnes: [Søk digitalt via eByggesøk](https://www.sandnes.kommune.no/byggesak)

**Behandlingstid:**
- 3 uker for enkle tiltak
- 12 uker for mer komplekse saker

**Skriv inn adressen din for å få mer spesifikk informasjon om hva som gjelder for din eiendom.**
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

Prøv for eksempel: *"Løkkeveien 45, Stavanger"* eller *"Hva kan jeg bygge uten å søke?"*
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;
    let context: { addressInfo?: string; regulations?: string } = {};

    // Check if the message looks like an address
    if (looksLikeAddress(lastMessage)) {
      try {
        const addresses = await searchAddress(lastMessage);

        if (addresses.length > 0) {
          const address = addresses[0];
          context.addressInfo = formatPropertyInfo(address);
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
