import Anthropic from '@anthropic-ai/sdk';
import { prisma } from './db.js';
import { config } from '../config/env.js';
import { calculateStampDutyAndTaxes } from '@bhoomi/finance';

export interface ChatReply {
  sessionId: string;
  reply: string;
  groundedData?: Record<string, unknown>;
  handOffToBroker: boolean;
  brokerContact?: {
    name: string;
    role: string;
    phone: string;
  };
}

export class ClaudeChatService {
  private anthropic: Anthropic | null = null;

  constructor() {
    if (config.anthropicApiKey && config.anthropicApiKey.startsWith('sk-ant-')) {
      this.anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    }
  }

  /**
   * Retrieves property listing context from DB, formats grounding context,
   * queries Claude (or fallback grounding engine), and stores conversation history.
   */
  async processGroundedChat(params: {
    sessionId?: string;
    userId?: string;
    propertyId: string;
    message: string;
  }): Promise<ChatReply> {
    const { propertyId, message, userId } = params;

    // 1. Fetch exact listing from database
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: { select: { id: true, name: true, role: true, mobile: true } },
        amenities: true,
        media: { select: { id: true, mediaType: true, isLocked: true } },
      },
    });

    if (!property) {
      throw new Error(`Listing with ID "${propertyId}" was not found in the verified database.`);
    }

    // 2. Compute accurate statutory taxes and stamp duty estimates
    const taxEstimate = calculateStampDutyAndTaxes(property.priceTotal, {
      isMunicipalCorporation: property.city.toLowerCase() === 'nagpur',
    });

    // 3. Find or create ChatSession
    let session = params.sessionId
      ? await prisma.chatSession.findUnique({ where: { id: params.sessionId } })
      : null;

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId: userId || null,
          propertyId,
        },
      });
    }

    // Store incoming user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: 'USER',
        text: message,
      },
    });

    // 4. Grounded response generation
    let replyText = '';
    const shouldHandOff =
      /contact|call|meet|schedule|visit|site visit|broker|phone|negotiate|book/i.test(message);

    if (this.anthropic) {
      try {
        const systemPrompt = `You are Bhoomi Assistant, an AI real estate advisor for the Bhoomi Marketplace in Maharashtra (Nagpur/Wardha region).
You MUST ONLY answer questions using the exact grounded database record provided below.
Rules:
1. If the user asks for information not in the listing (e.g. historical sales, owner personal details), strictly answer: "I don't have that information in the verified listing records. Please contact the listing agent directly."
2. Whenever discussing taxes, registration, or stamp duty, always include the statutory disclaimer.
3. Keep answers clear, factual, polite, and professional.

GROUNDED LISTING DATA:
- Title: ${property.title}
- Property Type: ${property.propertyType} (${property.listingType === 'SALE' ? 'For Sale' : 'For Rent'})
- BHK: ${property.bhk ? `${property.bhk} BHK` : 'N/A (Plot)'}
- Area: ${property.areaSqFt} sq.ft. (Listed as ${property.areaOriginal} ${property.areaUnit})
- Total Price: ₹${property.priceTotal.toLocaleString('en-IN')}
- Price per Sq.Ft.: ₹${property.pricePerSqFt.toLocaleString('en-IN')}
- Location: ${property.locality}, ${property.city} (Address: ${property.address})
- Availability: ${property.availability}
- Furnishing: ${property.furnishing}
- Listed By: ${property.owner.name} (${property.ownerRole})
- Amenities: ${property.amenities.map((a) => a.name).join(', ') || 'Standard infrastructure'}
- Estimated Stamp Duty (Maharashtra): ₹${taxEstimate.stampDutyAmount.toLocaleString('en-IN')} (${taxEstimate.stampDutyPercent}%)
- Estimated Registration Fee: ₹${taxEstimate.registrationAmount.toLocaleString('en-IN')}
- Total Estimated Acquisition Cost: ₹${taxEstimate.totalAcquisitionCost.toLocaleString('en-IN')}
- Disclaimer: ${taxEstimate.disclaimer}`;

        const response = await this.anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          system: systemPrompt,
          messages: [{ role: 'user', content: message }],
        });

        const contentBlock = response.content[0];
        replyText = contentBlock.type === 'text' ? contentBlock.text : '';
      } catch (err) {
        console.warn('Anthropic API call failed or rate limited, falling back to deterministic grounding engine:', err);
        replyText = this.generateDeterministicGroundedReply(property, taxEstimate, message);
      }
    } else {
      replyText = this.generateDeterministicGroundedReply(property, taxEstimate, message);
    }

    // Persist assistant message in DB
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: 'ASSISTANT',
        text: replyText,
        metadata: JSON.stringify({
          propertyId: property.id,
          priceTotal: property.priceTotal,
          pricePerSqFt: property.pricePerSqFt,
          taxes: taxEstimate,
        }),
      },
    });

    return {
      sessionId: session.id,
      reply: replyText,
      groundedData: {
        propertyId: property.id,
        title: property.title,
        priceTotal: property.priceTotal,
        pricePerSqFt: property.pricePerSqFt,
        areaSqFt: property.areaSqFt,
        taxes: taxEstimate,
      },
      handOffToBroker: shouldHandOff,
      brokerContact: shouldHandOff
        ? {
            name: property.owner.name,
            role: property.ownerRole,
            phone: property.contactPhone,
          }
        : undefined,
    };
  }

  /**
   * High-accuracy deterministic grounding engine when Anthropic API key is absent.
   */
  private generateDeterministicGroundedReply(
    property: any,
    taxEstimate: any,
    message: string
  ): string {
    const q = message.toLowerCase();

    if (q.includes('price') || q.includes('cost') || q.includes('rate') || q.includes('budget') || q.includes('per sq')) {
      return `This property "${property.title}" in ${property.locality}, ${property.city} is priced at ₹${property.priceTotal.toLocaleString('en-IN')} (approx. ₹${property.pricePerSqFt.toLocaleString('en-IN')} per sq.ft.). Ready for ${property.listingType === 'SALE' ? 'outright sale' : 'lease/rent'}.`;
    }

    if (q.includes('area') || q.includes('size') || q.includes('sqft') || q.includes('dimension') || q.includes('bhk')) {
      const bhkStr = property.bhk ? `${property.bhk} BHK` : 'Plot layout';
      return `The property offers a total area of ${property.areaSqFt.toLocaleString('en-IN')} sq.ft. (original listing entry: ${property.areaOriginal} ${property.areaUnit}). Configuration is ${bhkStr}.`;
    }

    if (q.includes('tax') || q.includes('stamp duty') || q.includes('registration') || q.includes('govt') || q.includes('gst')) {
      return `Based on Maharashtra Revenue Department rates for ${property.city}:
- Stamp Duty (${taxEstimate.stampDutyPercent}%): ₹${taxEstimate.stampDutyAmount.toLocaleString('en-IN')}
- Registration Fee: ₹${taxEstimate.registrationAmount.toLocaleString('en-IN')}
- GST: ₹${taxEstimate.gstAmount.toLocaleString('en-IN')}
- Total Estimated Acquisition: ₹${taxEstimate.totalAcquisitionCost.toLocaleString('en-IN')}

*${taxEstimate.disclaimer}*`;
    }

    if (q.includes('amenit') || q.includes('facility') || q.includes('feature') || q.includes('parking') || q.includes('lift')) {
      const amenitiesList = property.amenities.map((a: any) => a.name).join(', ');
      return amenitiesList
        ? `Amenities available for this property: ${amenitiesList}. Furnishing status: ${property.furnishing}.`
        : `This property includes essential civic connections and is located in ${property.locality}. Furnishing status: ${property.furnishing}.`;
    }

    if (q.includes('location') || q.includes('address') || q.includes('where') || q.includes('wardha') || q.includes('nagpur') || q.includes('near')) {
      return `Located at: ${property.address}, ${property.locality}, ${property.city}. Coordinates: (${property.latitude.toFixed(4)}, ${property.longitude.toFixed(4)}).`;
    }

    if (q.includes('contact') || q.includes('agent') || q.includes('broker') || q.includes('owner') || q.includes('visit') || q.includes('call')) {
      return `This property is listed by ${property.owner.name} (${property.ownerRole}). You can use the "Request Callback" button or click "Connect with Broker" to schedule an on-site visit or negotiate terms.`;
    }

    // Default grounded overview
    return `"${property.title}" is a verified ${property.propertyType} in ${property.locality}, ${property.city}.
- Total Price: ₹${property.priceTotal.toLocaleString('en-IN')} (₹${property.pricePerSqFt.toLocaleString('en-IN')} / sq.ft.)
- Built-up/Plot Area: ${property.areaSqFt} sq.ft.
- Availability: ${property.availability}
- Listed by: ${property.owner.name} (${property.ownerRole})

Feel free to ask about taxes, stamp duty calculations, amenities, or click below to speak directly with the listing representative!`;
  }
}

export const claudeChatService = new ClaudeChatService();
