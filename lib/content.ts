/**
 * Marketing copy that is not tied to a single tour: trust points, the day
 * timeline, safety, the FAQ and guest reviews.
 */

export type TrustPoint = { title: string; body: string };
export const trustPoints: TrustPoint[] = [
  {
    title: "Certified river guides",
    body: "Every raft runs with a trained, English-speaking guide who knows the river.",
  },
  {
    title: "Safety gear included",
    body: "Helmet, life jacket and paddle checked before each run, with a safety briefing.",
  },
  {
    title: "Insured trips",
    body: "All guests are covered by the operator's accident insurance on the water.",
  },
  {
    title: "Free cancellation",
    body: "Cancel at no cost up to 48 hours before your departure.",
  },
  {
    title: "Easy payment",
    body: "Card, QRIS, e-wallet, PayPal or cash at base camp.",
  },
];

export type PaymentMethod = {
  label: string;
  detail: string;
  venueOnly?: boolean;
};

export const paymentMethods: PaymentMethod[] = [
  { label: "Visa & Mastercard", detail: "Debit or credit, chip or contactless" },
  { label: "QRIS", detail: "Scan with any Indonesian bank or e-wallet app" },
  { label: "E-wallet", detail: "GoPay, OVO, DANA and ShopeePay" },
  { label: "PayPal", detail: "For guests paying from overseas" },
  { label: "Google Pay", detail: "Tap to pay from an Android phone" },
  { label: "Apple Pay", detail: "Tap to pay from an iPhone or Apple Watch" },
  {
    label: "Cash at base camp",
    detail: "Indonesian rupiah, on arrival",
    venueOnly: true,
  },
];

export const includedItems: { title: string; body: string }[] = [
  {
    title: "All rafting equipment",
    body: "Raft, paddle, helmet and life jacket, checked before every departure.",
  },
  {
    title: "Professional guide",
    body: "One trained guide per raft, steering and calling the strokes from the back.",
  },
  {
    title: "Hotel pickup and drop-off",
    body: "Return transport from Ubud, Seminyak, Kuta, Sanur and Canggu.",
  },
  {
    title: "Lunch after the run",
    body: "Buffet lunch at base camp, with vegetarian options on request.",
  },
  {
    title: "Hot shower and lockers",
    body: "Changing rooms, hot water and a locker for your valuables.",
  },
  {
    title: "Accident insurance",
    body: "Cover for the duration of the trip, included in the price.",
  },
];

export const dayTimeline: { time: string; title: string; body: string }[] = [
  {
    time: "Pickup",
    title: "Hotel pickup",
    body: "An air-conditioned car collects you from your hotel; the driver confirms the time the day before.",
  },
  {
    time: "Arrival",
    title: "Base camp briefing",
    body: "Sign in, collect your helmet and life jacket, and get the safety briefing from your guide.",
  },
  {
    time: "On the water",
    title: "14 km descent",
    body: "Two and a half to three hours of Class II–III rapids, with flat stretches to look up at the valley.",
  },
  {
    time: "Finish",
    title: "The drop and the take-out",
    body: "The four-metre chute under the bridge, then a short walk up to base camp.",
  },
  {
    time: "After",
    title: "Shower, lunch, return",
    body: "Hot shower, buffet lunch on the terrace, then the drive back to your hotel.",
  },
];

export const safetyPoints: string[] = [
  "Helmets and life jackets for every guest, inspected before each departure",
  "Safety briefing and paddle practice before you leave the bank",
  "Guides trained in white-water rescue, with a safety kayak on the water",
  "First-aid kit and dry bags carried on every trip",
  "Trips cancelled and refunded if the river is unsafe",
  "Minimum age 7; not suitable during pregnancy or with serious back or heart conditions",
];

export type Faq = { question: string; answer: string };

export const faqs: Faq[] = [
  {
    question: "How do I book?",
    answer:
      "Choose a tour and departure time in the booking box, check the date, and send us the details on WhatsApp. We reply with confirmation, your pickup time and the meeting point. You can also message us directly without using the form — we need the tour, the date, how many adults and children, and the hotel you are staying at.",
  },
  {
    question: "How do I pay?",
    answer:
      "Nothing is charged when you send the booking form. Once we confirm your spots we send the payment details on WhatsApp, and you choose the method: Visa or Mastercard, QRIS, e-wallet (GoPay, OVO, DANA, ShopeePay), PayPal, Google Pay or Apple Pay. Cash in Indonesian rupiah at base camp is available only for trips where you drive to our starting point — if we pick you up from your hotel, payment is settled before pickup. Groups of ten or more may be asked for a deposit, explained before you commit.",
  },
  {
    question: "Can I cancel or change my date?",
    answer:
      "Yes. Cancel or move your booking at no cost up to 48 hours before departure — just message us. Inside 48 hours we may not be able to refund a deposit, and if the river is closed for safety (heavy rain, Nyepi) we will move you to another day or refund you in full.",
  },
  {
    question: "What should I bring?",
    answer:
      "A change of clothes, a towel, sunscreen and a dry bag or waterproof pouch for your phone. Wear shoes that can get wet — sandals or old trainers. Leave valuables in the locker at base camp. Everything else, including the raft, helmet and life jacket, is provided.",
  },
  {
    question: "Do I need to be able to swim?",
    answer:
      "No. The life jacket keeps you afloat and your guide steers the raft, so non-swimmers do the descent comfortably. Tell your guide before you launch if you are nervous or cannot swim, and they will seat you accordingly.",
  },
  {
    question: "Is it suitable for children?",
    answer:
      "Children from about seven years old can join, at the child rate, as long as they are comfortable in water and can follow instructions. Families with younger children should message us first — for some ages a private raft with an extra guide is the better option.",
  },
  {
    question: "What happens if it rains?",
    answer:
      "Rafting runs in the rain — you are going to be wet anyway. The Telaga Waja is spring-fed, so it stays runnable when rain-swollen rivers elsewhere are closed. If conditions become genuinely unsafe the trip is cancelled and you are moved to another day or refunded.",
  },
  {
    question: "Where do you pick up from?",
    answer:
      "Ubud, Seminyak, Kuta, Sanur and Canggu are included in the price. Other areas can usually be arranged for an extra transport charge — send us your hotel name on WhatsApp and we will confirm before you book.",
  },
];

export type Review = {
  name: string;
  country: string;
  rating: number;
  quote: string;
  date: string;
};

export const reviews: Review[] = [];

export type GoogleReview = {
  name: string;
  when: string;
  rating: number;
  quote: string;
};

export const googleReviewSummary = {
  name: "Telaga Waja Adventures TWA (start point)",
  total: 162,
};

export const googleReviews: GoogleReview[] = [
  {
    name: "Salem Aldini",
    when: "4 months ago",
    rating: 5,
    quote:
      "من احلى التجارب اللي جريتها وان شاء الله راح اكررها مره ثانية انصح اللي يبغا تجربه جديده يزورهم تتعاملهم ممتاز ومتعاونين واسعارهم حلوه 👍",
  },
  {
    name: "ibrahim awad",
    when: "4 months ago",
    rating: 5,
    quote:
      "تجربة رائعة جداً! المواعيد دقيقة للغوص و المكان في غاية النظافة، تجهيز بجودة ممتازة، والطاقم في غاية الاحترافية واللطف، وحرص على شرح كل التفاصيل لضمان تجربة آمنة وممتعة.",
  },
  {
    name: "Janu German",
    when: "4 months ago",
    rating: 5,
    quote:
      "There are two companies you can do it with — this one and the one around the corner — they're both pretty good, but the guides here really made the day.",
  },
];

export type GalleryImage = { src: string; alt: string };

export const gallery: GalleryImage[] = [
  { src: "/media/gallery/hero.jpg", alt: "Guests paddling a raft through white water on the Telaga Waja river" },
  { src: "/media/gallery/rapids.jpg", alt: "White water rapids on the Telaga Waja river" },
  { src: "/media/gallery/canyon.jpg", alt: "Jungle canyon walls along the Telaga Waja river" },
  { src: "/media/gallery/guide.jpg", alt: "River guide explaining the route before departure" },
  { src: "/media/gallery/lunch.jpg", alt: "Buffet lunch at the base camp terrace" },
  { src: "/media/gallery/waterfall.jpg", alt: "Waterfall visible from the river canyon" },
  { src: "/media/gallery/drop.jpg", alt: "The four-metre drop below the bridge at the finish" },
  { src: "/media/gallery/group.jpg", alt: "Raft crew smiling after the descent" },
  { src: "/media/gallery/morning.jpg", alt: "Morning light on the river valley" },
  { src: "/media/gallery/sunset.jpg", alt: "Sunset over the Karangasem hills" },
  { src: "/media/gallery/family.jpg", alt: "Family celebrating on the raft after the run" },
  { src: "/media/gallery/equipment.jpg", alt: "Helmet and life jacket by the river bank" },
  { src: "/media/gallery/shower.jpg", alt: "Hot shower and changing rooms at base camp" },
  { src: "/media/gallery/transport.jpg", alt: "Pickup car waiting for the group" },
  { src: "/media/gallery/handling.jpg", alt: "Guide handling the raft at base camp" },
];

export const galleryHeroImage = "/media/hero.jpg";

export type GallerySection = { title: string; subtitle: string; heroImage: string; images: GalleryImage[] };

export const gallerySection: GallerySection = {
  title: "Moment You Never Forget",
  subtitle: "Slide image: max 15, each linking to the gallery page",
  heroImage: galleryHeroImage,
  images: gallery,
};
