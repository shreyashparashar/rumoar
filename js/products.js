// ─────────────────────────────────────────────────────────────
//  RUMOAR catalogue
//  Edit this file to change names, copy, prices or order.
//  Images live in /assets/products/<id>-front.webp and -side.webp
//  NOTE: finishes are described from the renders. Confirm the
//  final materials with production before launch.
// ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: "all",      label: "All" },
  { id: "backpack", label: "Backpacks" },
  { id: "sling",    label: "Slings & Belt Bags" },
  { id: "carry",    label: "Totes & Top-Handles" },
];

const p = (o) => ({
  ...o,
  images: [`assets/products/${o.id}-front.webp`, `assets/products/${o.id}-side.webp`],
});

export const PRODUCTS = [
  p({
    id: "sentinel",
    name: "The Sentinel",
    category: "backpack",
    type: "Sculpted shell backpack",
    colour: "Onyx / Stone",
    price: 4849,
    tagline: "For the days that hit back.",
    description:
      "An onyx exoskeleton moulded over soft, stone-textured panels, built to take the knocks of the city and still look composed. Twin full-height zips finish in high-vis orange pulls you can find without looking, and cinch straps at the base keep the load locked in. Armour, kept quiet.",
    details: [
      "Moulded exoskeleton over textured panels",
      "Twin full-height zips with orange pulls",
      "Compression straps and padded harness",
      "Top grab handle with raised RUMOAR plate",
    ],
  }),
  p({
    id: "futurist",
    name: "The Futurist",
    category: "backpack",
    type: "Sculpted shell backpack",
    colour: "Stone / Graphite",
    price: 4749,
    tagline: "For the man already living in next year.",
    description:
      "A sculpted shell in soft stone, with textured panels and a graphite spine that sweeps up into the top handle. It looks drawn for another decade and carries like it was made for this one. Orange zip pulls bring the one hit of colour, and a vented base keeps it light on the back.",
    details: [
      "Moulded shell with textured side panels",
      "Sculpted spine that forms the top handle",
      "Full-height zip with orange pulls",
      "Vented base and padded mesh straps",
    ],
  }),
  p({
    id: "maverick",
    name: "The Maverick",
    category: "backpack",
    type: "Roll-top backpack",
    colour: "Liquid Silver",
    price: 4999,
    tagline: "For the days you’d rather be seen.",
    description:
      "A roll-top in mirror-finish silver that catches every light on the street. A weather-sealed shell, a vertical zip track for quick access, and gunmetal hardware that keeps it sharp rather than showy. Wear it over all black and let it do the talking.",
    details: [
      "Roll-top closure with buckle strap",
      "Full-length vertical zip access",
      "Water-resistant coated shell",
      "Padded, breathable back panel",
    ],
  }),
  p({
    id: "provocateur",
    name: "The Provocateur",
    category: "carry",
    type: "Structured top-handle",
    colour: "Noir Calf-Hair",
    price: 3999,
    tagline: "For the entrance, not the exit.",
    description:
      "A structured top-handle in brushed noir calf-hair texture, layered with asymmetric flaps and pinned with polished studs. Smooth leather handles and a leather name plate frame the texture. It belongs on the arm of a man who has already decided.",
    details: [
      "Rolled leather top handles",
      "Asymmetric studded front flaps",
      "Two side gusset pockets",
      "Structured base that holds its shape",
    ],
  }),
  p({
    id: "drifter",
    name: "The Drifter",
    category: "backpack",
    type: "Drawstring backpack",
    colour: "Noir Crinkle / White Piping",
    price: 4799,
    tagline: "For the days without a fixed address.",
    description:
      "A drawstring backpack in crinkled noir leather that creases and softens the way a good jacket does. Twin white stripes run the full drop, two diagonal zip pockets sit close at hand, and the top cinches shut in one pull. On one shoulder it reads off-duty. On both, it reads intent.",
    details: [
      "Drawstring cinch with top carry loop",
      "Two diagonal front zip pockets",
      "Contrast white piping, front to back",
      "Adjustable buckled shoulder straps",
    ],
  }),
  p({
    id: "chameleon",
    name: "The Chameleon",
    category: "carry",
    type: "Convertible tote-pack",
    colour: "Iridescent Teal",
    price: 3849,
    tagline: "For the man who’s someone else by evening.",
    description:
      "Iridescent nylon that shifts from teal to petrol to violet as you move. Carry it by the handles, sling it from the shoulder, or clip on the straps and wear it as a backpack. Four utility pockets keep the day sorted; the colour keeps it interesting.",
    details: [
      "Three ways to carry: tote, shoulder, backpack",
      "Four front utility pockets",
      "Detachable padded shoulder strap",
      "Gunmetal clip hardware",
    ],
  }),
  p({
    id: "vanguard",
    name: "The Vanguard",
    category: "backpack",
    type: "Utility backpack",
    colour: "Noir Crinkle",
    price: 4949,
    tagline: "For the first one through the door.",
    description:
      "Utility, rendered in crinkled noir leather. Webbing ladders run across the front for clipping on whatever the day demands, and a clamshell zip opens it flat like a suitcase. Built hard, carried sharp.",
    details: [
      "Clamshell full-zip opening",
      "Front webbing ladders and buckled straps",
      "Discreet front zip pocket",
      "Ventilated mesh back panel",
    ],
  }),
  p({
    id: "outlier",
    name: "The Outlier",
    category: "sling",
    type: "Twin-pouch harness sling",
    colour: "Forest Green",
    price: 3899,
    tagline: "For the one who doesn’t walk the line.",
    description:
      "Two pouches, one strap, worn like a holster. Forest-green pebbled leather with a tonal embossed panel on the lower pocket and a clip buckle that locks it close. Wear it across a white tee and the outfit is done.",
    details: [
      "Twin zip pouches on a single harness",
      "Tonal embossed lower panel",
      "Quick-release clip buckle",
      "Adjustable cross-body strap",
    ],
  }),
  p({
    id: "heir",
    name: "The Heir",
    category: "backpack",
    type: "Roll-top backpack",
    colour: "Oxblood",
    price: 4699,
    tagline: "Old-money instincts. New-money hours.",
    description:
      "A deep oxblood roll-top with a soft-touch front panel and the RUMOAR name pressed vertically into it. One central strap, one buckle, nothing extra. The glossed shell shrugs off the rain; the colour does everything else.",
    details: [
      "Roll-top with central buckle strap",
      "Zip-around front compartment",
      "Debossed vertical RUMOAR panel",
      "Side compression straps",
    ],
  }),
  p({
    id: "diplomat",
    name: "The Diplomat",
    category: "carry",
    type: "Doctor-style top-handle",
    colour: "Gunmetal Satin",
    price: 3949,
    tagline: "For negotiations, formal or otherwise.",
    description:
      "A doctor-bag silhouette in padded gunmetal satin, held by a rolled leather handle and a sculpted turn-lock. Side buckles let it open wide or pull in slim. Inside sits a tan-lined zip pocket: the detail only you will know about.",
    details: [
      "Sculpted turn-lock closure",
      "Side buckles adjust the profile",
      "Interior zip pocket with tan accent",
      "Padded satin-finish shell",
    ],
  }),
  p({
    id: "operator",
    name: "The Operator",
    category: "backpack",
    type: "Flap backpack",
    colour: "Matte Black",
    price: 4899,
    tagline: "For the man who runs the room, quietly.",
    description:
      "A technical nylon body under a pebble-grain flap, cut with a diagonal zip that breaks the grid just enough. Compression straps keep the silhouette sharp whether it’s carrying a laptop or nothing at all, and leather-finish side pockets hold a bottle without spoiling the line.",
    details: [
      "Pebble-grain flap with zip pocket",
      "Diagonal front zip",
      "Side compression straps",
      "Leather-finish base and side pockets",
    ],
  }),
  p({
    id: "purist",
    name: "The Purist",
    category: "sling",
    type: "Saddle sling",
    colour: "Bone White",
    price: 3599,
    tagline: "For the clean slate.",
    description:
      "A puffed saddle sling in bone white, its curved flap traced in grey piping, its strap fastened by an industrial quick-release buckle. Soft to the touch, sharp in outline. Worn high across the chest, it lifts every dark outfit you own.",
    details: [
      "Curved saddle flap over zip compartment",
      "Two side zip pockets",
      "Metal quick-release buckle",
      "Adjustable webbing strap",
    ],
  }),
  p({
    id: "wanderer",
    name: "The Wanderer",
    category: "backpack",
    type: "Rucksack",
    colour: "Espresso",
    price: 4599,
    tagline: "For the long way round.",
    description:
      "A rucksack in espresso nylon with a satin hand, trimmed in leather and closed with two polished-metal buckles. Bellowed side pockets take the day’s overflow, and the drawcord top opens wide for weekends that run long.",
    details: [
      "Twin polished quick-release buckles",
      "Zip top pocket",
      "Two bellowed side pockets",
      "Leather-finish trim and logo bar",
    ],
  }),
  p({
    id: "messenger",
    name: "The Messenger",
    category: "carry",
    type: "Cargo shoulder bag",
    colour: "Noir Crinkle / Antique Brass",
    price: 3799,
    tagline: "For the one who always has somewhere to be.",
    description:
      "Crinkled noir leather with an archive soul. Buckled cargo pockets at each side, an antique-brass zip across the front, and long leather tassels that move when you do. Roomy enough for the day, slouchy enough for the night after.",
    details: [
      "Main zip compartment",
      "Buckled side cargo pockets",
      "Antique-brass hardware",
      "Adjustable shoulder strap",
    ],
  }),
  p({
    id: "strategist",
    name: "The Strategist",
    category: "backpack",
    type: "Cross-strap backpack",
    colour: "Charcoal",
    price: 4549,
    tagline: "For the mind three moves ahead.",
    description:
      "Charcoal ripstop with a cross-strap harness that cinches the load and draws the eye. A sealed diagonal zip up top, a mesh quick-pocket below, and a clean, rounded silhouette that sits as well over a coat as over a hoodie.",
    details: [
      "X-strap compression harness, twin buckles",
      "Water-resistant sealed top zip",
      "Mesh quick-access front pocket",
      "Padded back panel and straps",
    ],
  }),
  p({
    id: "explorer",
    name: "The Explorer",
    category: "carry",
    type: "Convertible tote-pack",
    colour: "Bottle Green Gloss",
    price: 3699,
    tagline: "For the map you’re drawing as you go.",
    description:
      "A tall tote in high-shine bottle green, with a soft-touch matte pouch set on the front like a badge. Carry it by the handles, sling it on the detachable strap, or wear it as a backpack. Weather-ready, city-ready.",
    details: [
      "Tote, shoulder and backpack carry",
      "Matte front zip pouch",
      "Water-resistant glossed shell",
      "Detachable shoulder strap",
    ],
  }),
  p({
    id: "nomad",
    name: "The Nomad",
    category: "sling",
    type: "Twin-pocket belt bag",
    colour: "Noir",
    price: 3549,
    tagline: "For travelling light, and fast.",
    description:
      "Two zip pockets on a wide leather-finish belt, the RUMOAR name embossed tonal across the front, silver chain pulls for a little edge. Wear it at the waist, or loosen it and sling it across. A belt bag that knows it’s an accessory.",
    details: [
      "Twin zip compartments",
      "Tonal embossed logo",
      "Chain-link zip pulls",
      "Wide belt with pin buckle",
    ],
  }),
];

export const byId = Object.fromEntries(PRODUCTS.map((x) => [x.id, x]));

export const formatINR = (n) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
