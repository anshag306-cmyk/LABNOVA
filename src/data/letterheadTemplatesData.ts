import { LetterheadTemplate, LetterheadTemplateId } from '../types';

export const LETTERHEAD_TEMPLATES: LetterheadTemplate[] = [
  {
    id: 'classic_medical',
    name: 'Classic Medical',
    category: 'Accredited Standard',
    tagline: 'Formal Academic & Reference Pathology Format',
    description:
      'Timeless clinical letterhead featuring a deep slate navy header banner, official medical crest emblem, structured NABL ISO 15189 accreditation block, and dual authorized signatories with formal circular seal.',
    primaryColor: '#0f172a', // Deep Slate Navy
    secondaryColor: '#1e293b',
    badgeColor: '#059669', // Emerald Green
    styleArchetype: 'Traditional Clinical Reference',
    features: [
      'Full-width deep navy header banner with high-contrast white typography',
      'Accredited NABL ISO 15189 badge & central license directory',
      'Dual verification signatory block with official pathologist stamp',
      'Optimal high-density layout suitable for multi-parameter panels (CBC, LFT, KFT)',
    ],
    recommendedFor: 'Hospital reference laboratories, multispecialty pathology centers, and NABL diagnostic networks.',
  },
  {
    id: 'modern_diagnostic',
    name: 'Modern Diagnostic',
    category: 'Digital Innovation',
    tagline: 'Contemporary Split-Header with Integrated QR Authentication',
    description:
      'Sleek modern design with a cool medical teal/cyan theme, dynamic split-header layout, live cryptographic QR matrix verification, and refined light-tinted result rows for maximum reading comfort.',
    primaryColor: '#0284c7', // Sky Cyan / Medical Teal
    secondaryColor: '#0369a1',
    badgeColor: '#0284c7',
    styleArchetype: 'Contemporary Digital LIMS',
    features: [
      'Modern split header with bold facility identity and specialty pill tag',
      'Dynamic digital verification QR badge with SHA-256 hash stamp',
      'Rounded patient demographic card with soft cyan contrast background',
      'Alternating row highlights with high-visibility abnormal indicators',
    ],
    recommendedFor: 'Automated diagnostic chains, molecular testing labs, and digital healthcare centers.',
  },
  {
    id: 'minimal_professional',
    name: 'Minimal Professional',
    category: 'Monochrome High-Contrast',
    tagline: 'Refined Typography with Clean Dividers & Zero Distractions',
    description:
      'High-contrast minimalist layout inspired by Scandinavian clinical design. Eliminates heavy color fills in favor of pristine typography, precision hairline dividers, and spacious patient vitals.',
    primaryColor: '#18181b', // Pure Charcoal
    secondaryColor: '#27272a',
    badgeColor: '#52525b',
    styleArchetype: 'Ultra-Clean Scandinavian Minimalist',
    features: [
      'Pure white background with razor-sharp charcoal typography and double hairline rules',
      'Spacious borderless patient demographic matrix for high legibility',
      'Eco-friendly ink-saving structure ideal for high-volume monochrome laser printing',
      'Compact streamlined dual-signatory line with digital verification code',
    ],
    recommendedFor: 'Private consulting pathologists, executive health screening, and high-volume print efficiency.',
  },
  {
    id: 'premium_laboratory',
    name: 'Premium Laboratory',
    category: 'Executive Luxury',
    tagline: 'Royal Indigo & Gold Trimmed Diagnostic Excellence',
    description:
      'Prestigious executive presentation featuring deep royal indigo accents, subtle gold border highlights, crested shield insignia, and an ornamental golden authorization seal for VIP health checks.',
    primaryColor: '#312e81', // Royal Indigo
    secondaryColor: '#4338ca',
    badgeColor: '#d97706', // Amber Gold
    styleArchetype: 'Executive VIP Medical Presentation',
    features: [
      'Rich royal indigo header bar paired with elegant gold/emerald accreditation seals',
      'Embossed-style patient UHID accession card with soft gradient border',
      'Prominent test parameter rows with high-contrast biological reference intervals',
      'Gold-trimmed chief pathologist sign-off seal and cryptographic verification',
    ],
    recommendedFor: 'Premium wellness clinics, executive checkups, and specialized tertiary care laboratories.',
  },
  {
    id: 'clean_medical',
    name: 'Clean Medical',
    category: 'Clinical Fresh',
    tagline: 'Fresh Emerald Green Accents with Patient-Centric Clarity',
    description:
      'Bright, welcoming clinical letterhead utilizing soothing medical emerald green highlights, clear patient demographic tiles, high-clarity flag markers, and well-spaced reference intervals.',
    primaryColor: '#047857', // Emerald Green
    secondaryColor: '#065f46',
    badgeColor: '#10b981',
    styleArchetype: 'Fresh Holistic Diagnostic',
    features: [
      'Clean white header framed with an emerald top accent bar and health emblem',
      'Soft mint-tinted patient vitals container with specimen detail pills',
      'Vivid high/low/critical abnormality flags for rapid physician triage',
      'Organized dual-signatory footer with digital NABL approval certificate',
    ],
    recommendedFor: 'Community health clinics, wellness diagnostics, pediatric, and preventative pathology centers.',
  },
  {
    id: 'corporate_lab',
    name: 'Corporate Laboratory',
    category: 'Enterprise Multi-Center',
    tagline: 'Deep Cobalt Corporate Header with Multi-Facility ISO Compliance',
    description:
      'Structured enterprise layout designed for large multi-center diagnostic networks. Features comprehensive licensing directories, barcode accession tracking, and strict chain-of-custody disclaimers.',
    primaryColor: '#1e3a8a', // Corporate Cobalt Blue
    secondaryColor: '#172554',
    badgeColor: '#3b82f6',
    styleArchetype: 'Multi-Branch Enterprise Network',
    features: [
      'Corporate cobalt header directory with central barcode and ISO certification',
      'Structured specimen requisition grid with collection timestamp & center ID',
      'Strict diagnostic disclaimer block and legal chain-of-custody verification',
      'Enterprise multi-signatory footer with technologist, supervisor & director approvals',
    ],
    recommendedFor: 'Central diagnostic chains, nationwide hospital networks, and corporate health testing providers.',
  },
  {
    id: 'modern_medical',
    name: 'Modern Medical',
    category: 'Vibrant Precision',
    tagline: 'Bold Modern Header with High-Contrast Diagnostic Grid',
    description:
      'High-energy modern design with dynamic royal blue geometry, modern badge pills for specimen collection details, bold test category separators, and a prominent digital certificate badge.',
    primaryColor: '#2563eb', // Royal Blue
    secondaryColor: '#1d4ed8',
    badgeColor: '#4f46e5', // Indigo
    styleArchetype: 'High-Tech Precision Lab',
    features: [
      'Dynamic geometric top header with bold facility branding and modern typography',
      'Smart demographic pills displaying UHID, sample type, barcode, and referral doctor',
      'Clean high-contrast results table with bold critical value highlights',
      'Modern digital certification badge with integrated QR code and doctor sign-off',
    ],
    recommendedFor: 'High-tech pathology centers, computerized diagnostic labs, and modern clinical practices.',
  },
];

export const DEFAULT_LETTERHEAD_TEMPLATE_ID: LetterheadTemplateId = 'classic_medical';

export function getLetterheadTemplateById(id?: string): LetterheadTemplate {
  if (!id) {
    return LETTERHEAD_TEMPLATES[0];
  }
  const found = LETTERHEAD_TEMPLATES.find((t) => t.id === id);
  return found || LETTERHEAD_TEMPLATES[0];
}
