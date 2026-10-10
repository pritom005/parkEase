// High-fidelity parking-related image assets for ParkEase Chattogram
// Styled to strictly match SOFT PARK Neumorphism and Chattogram Municipal branding

export const HERO_PARKING_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#cfdcd1"/>
      <stop offset="100%" stop-color="#e8eee9"/>
    </linearGradient>
    <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3b4a40"/>
      <stop offset="100%" stop-color="#232f27"/>
    </linearGradient>
    <linearGradient id="buildingGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#b8c5bc"/>
      <stop offset="100%" stop-color="#cdd8d0"/>
    </linearGradient>
  </defs>

  <!-- Sky & Horizon -->
  <rect width="640" height="360" fill="url(#skyGrad)"/>

  <!-- Background Municipal Infrastructure -->
  <rect x="40" y="80" width="160" height="150" fill="url(#buildingGrad)" rx="4"/>
  <rect x="70" y="100" width="24" height="30" fill="#ffffff" opacity="0.6"/>
  <rect x="110" y="100" width="24" height="30" fill="#ffffff" opacity="0.6"/>
  <rect x="150" y="100" width="24" height="30" fill="#ffffff" opacity="0.6"/>
  <rect x="70" y="145" width="24" height="30" fill="#ffffff" opacity="0.6"/>
  <rect x="110" y="145" width="24" height="30" fill="#ffffff" opacity="0.6"/>
  <rect x="150" y="145" width="24" height="30" fill="#ffffff" opacity="0.6"/>

  <rect x="230" y="50" width="240" height="180" fill="#9faea3" rx="4"/>
  <rect x="250" y="70" width="40" height="24" fill="#ffffff" opacity="0.5"/>
  <rect x="310" y="70" width="40" height="24" fill="#ffffff" opacity="0.5"/>
  <rect x="370" y="70" width="40" height="24" fill="#ffffff" opacity="0.5"/>
  <rect x="250" y="110" width="40" height="24" fill="#ffffff" opacity="0.5"/>
  <rect x="310" y="110" width="40" height="24" fill="#ffffff" opacity="0.5"/>
  <rect x="370" y="110" width="40" height="24" fill="#ffffff" opacity="0.5"/>

  <!-- Paved Parking Ground -->
  <polygon points="0,200 640,200 640,360 0,360" fill="url(#roadGrad)"/>

  <!-- Marked Parking Bays -->
  <line x1="80" y1="220" x2="180" y2="350" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  <line x1="220" y1="220" x2="320" y2="350" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  <line x1="360" y1="220" x2="460" y2="350" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  <line x1="500" y1="220" x2="600" y2="350" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>

  <!-- Yellow Bay Accent Lines -->
  <line x1="140" y1="235" x2="210" y2="330" stroke="#e6b422" stroke-width="3" stroke-dasharray="6,6"/>
  <line x1="280" y1="235" x2="350" y2="330" stroke="#e6b422" stroke-width="3" stroke-dasharray="6,6"/>
  <line x1="420" y1="235" x2="490" y2="330" stroke="#e6b422" stroke-width="3" stroke-dasharray="6,6"/>

  <!-- Optical Boom Barrier Ingress Gate (Left) -->
  <rect x="30" y="160" width="16" height="90" fill="#1b5e3b" rx="3"/>
  <circle cx="38" cy="170" r="4" fill="#22c55e"/>
  <rect x="46" y="175" width="130" height="8" fill="#e6b422" rx="2" transform="rotate(-18 46 175)"/>

  <!-- ANPR Optical Scanner Pole -->
  <rect x="600" y="150" width="8" height="95" fill="#455549" rx="2"/>
  <rect x="585" y="145" width="28" height="14" fill="#16261d" rx="3"/>
  <circle cx="592" cy="152" r="3" fill="#38bdf8"/>

  <!-- Stylized Smart Parking Sensor Pods in Bays -->
  <circle cx="165" cy="275" r="9" fill="#1b5e3b" stroke="#ffffff" stroke-width="2"/>
  <circle cx="305" cy="275" r="9" fill="#1b5e3b" stroke="#ffffff" stroke-width="2"/>
  <circle cx="445" cy="275" r="9" fill="#e6b422" stroke="#ffffff" stroke-width="2"/>

  <!-- Municipal Emblem Badge Overlay -->
  <rect x="20" y="20" width="170" height="32" fill="#1b5e3b" rx="6"/>
  <text x="32" y="41" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="12">CHATTOGRAM METRO</text>
  <circle cx="172" cy="36" r="4" fill="#e6b422"/>
</svg>
`)}`;

export const PARKING_AREA_IMAGES: Record<number, string> = {
  // 1: GEC Circle Hub
  1: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
  <defs>
    <linearGradient id="gecSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b6cbbe"/>
      <stop offset="100%" stop-color="#dcefe3"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#gecSky)"/>
  <!-- Commercial Multideck Structure -->
  <rect x="50" y="60" width="540" height="160" fill="#2d4234" rx="8"/>
  <rect x="70" y="80" width="500" height="35" fill="#1b5e3b" rx="4"/>
  <rect x="70" y="130" width="500" height="35" fill="#1b5e3b" rx="4"/>
  <rect x="70" y="180" width="500" height="30" fill="#134429" rx="4"/>

  <!-- Floor Indicators -->
  <text x="85" y="103" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold">LEVEL 03 • CAR MATRIX (AVAILABLE: 14)</text>
  <text x="85" y="153" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold">LEVEL 02 • CAR MATRIX (AVAILABLE: 08)</text>
  <text x="85" y="201" fill="#e6b422" font-family="monospace" font-size="13" font-weight="bold">LEVEL 01 • MOTORCYCLE DOCK (AVAILABLE: 12)</text>

  <!-- Paved Ramp & Ground Bays -->
  <polygon points="0,220 640,220 640,360 0,360" fill="#323e35"/>
  <line x1="100" y1="240" x2="160" y2="350" stroke="#ffffff" stroke-width="4"/>
  <line x1="220" y1="240" x2="280" y2="350" stroke="#ffffff" stroke-width="4"/>
  <line x1="340" y1="240" x2="400" y2="350" stroke="#ffffff" stroke-width="4"/>
  <line x1="460" y1="240" x2="520" y2="350" stroke="#ffffff" stroke-width="4"/>

  <!-- Bay Numbers -->
  <text x="135" y="310" fill="#e6b422" font-family="monospace" font-size="18" font-weight="bold">C-01</text>
  <text x="255" y="310" fill="#e6b422" font-family="monospace" font-size="18" font-weight="bold">C-02</text>
  <text x="375" y="310" fill="#e6b422" font-family="monospace" font-size="18" font-weight="bold">C-03</text>
  <text x="495" y="310" fill="#e6b422" font-family="monospace" font-size="18" font-weight="bold">C-04</text>
</svg>
`)}`,

  // 2: Agrabad Commercial Area
  2: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
  <defs>
    <linearGradient id="agrSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b0c5ba"/>
      <stop offset="100%" stop-color="#e2ede5"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#agrSky)"/>

  <!-- Corporate Financial Towers Background -->
  <rect x="60" y="40" width="120" height="200" fill="#889c90" rx="3"/>
  <rect x="200" y="20" width="150" height="220" fill="#697e71" rx="3"/>
  <rect x="370" y="50" width="130" height="190" fill="#7a8f82" rx="3"/>
  <rect x="520" y="70" width="90" height="170" fill="#8ea296" rx="3"/>

  <!-- Ground Parking Plaza -->
  <polygon points="0,210 640,210 640,360 0,360" fill="#2a332c"/>
  <line x1="80" y1="230" x2="160" y2="350" stroke="#ffffff" stroke-width="5"/>
  <line x1="220" y1="230" x2="300" y2="350" stroke="#ffffff" stroke-width="5"/>
  <line x1="360" y1="230" x2="440" y2="350" stroke="#ffffff" stroke-width="5"/>
  <line x1="500" y1="230" x2="580" y2="350" stroke="#ffffff" stroke-width="5"/>

  <!-- Yellow Accent Boundaries -->
  <line x1="0" y1="210" x2="640" y2="210" stroke="#e6b422" stroke-width="3" stroke-dasharray="10,8"/>
  <text x="210" y="320" fill="#ffffff" font-family="monospace" font-size="16" font-weight="bold">AGRABAD CBD • ZONE A</text>
</svg>
`)}`,

  // 3: Khulshi Residential Hub
  3: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
  <defs>
    <linearGradient id="khulSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c1d9c7"/>
      <stop offset="100%" stop-color="#e4f2e8"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#khulSky)"/>

  <!-- Lush Green Hill Trees & Canopy -->
  <circle cx="80" cy="170" r="90" fill="#245837"/>
  <circle cx="190" cy="150" r="110" fill="#1b5e3b"/>
  <circle cx="340" cy="160" r="100" fill="#184a2f"/>
  <circle cx="480" cy="150" r="110" fill="#1b5e3b"/>
  <circle cx="590" cy="170" r="90" fill="#245837"/>

  <!-- Shaded Residential Parking Bays -->
  <polygon points="0,220 640,220 640,360 0,360" fill="#323c34"/>
  <line x1="90" y1="240" x2="150" y2="350" stroke="#ffffff" stroke-width="4"/>
  <line x1="210" y1="240" x2="270" y2="350" stroke="#ffffff" stroke-width="4"/>
  <line x1="330" y1="240" x2="390" y2="350" stroke="#ffffff" stroke-width="4"/>
  <line x1="450" y1="240" x2="510" y2="350" stroke="#ffffff" stroke-width="4"/>

  <text x="220" y="325" fill="#dcefe3" font-family="monospace" font-size="15" font-weight="bold">KHULSHI VIP SECTOR • BAY KM-01</text>
</svg>
`)}`,

  // 4: Bahaddarhat Bus Terminal Hub
  4: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
  <defs>
    <linearGradient id="bahSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bcd2c4"/>
      <stop offset="100%" stop-color="#e8f3ec"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#bahSky)"/>

  <!-- Arterial Transit Canopy Overhead -->
  <polygon points="30,80 610,80 580,180 60,180" fill="#1b5e3b"/>
  <text x="180" y="140" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">BAHADDARHAT BUS TERMINAL HUB</text>

  <!-- Paved Transit Bay Area -->
  <polygon points="0,200 640,200 640,360 0,360" fill="#2d372f"/>
  <line x1="120" y1="210" x2="160" y2="350" stroke="#e6b422" stroke-width="5" stroke-dasharray="10,6"/>
  <line x1="280" y1="210" x2="320" y2="350" stroke="#ffffff" stroke-width="5"/>
  <line x1="440" y1="210" x2="480" y2="350" stroke="#ffffff" stroke-width="5"/>

  <!-- Directional Transit Arrow -->
  <polygon points="310,270 330,270 330,285 345,285 320,310 295,285 310,285" fill="#e6b422"/>
</svg>
`)}`,

  // 5: Patenga Coastal Area
  5: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
  <defs>
    <linearGradient id="patSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#9fc2b4"/>
      <stop offset="60%" stop-color="#cbe5da"/>
      <stop offset="100%" stop-color="#eaf5f0"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#patSky)"/>

  <!-- Marine Drive Seaside Horizon & Promenade Palms -->
  <rect x="0" y="160" width="640" height="40" fill="#39796b" opacity="0.4"/>
  <!-- Palm silhouette 1 -->
  <path d="M70,220 Q80,150 110,120" stroke="#2d4a3e" stroke-width="6" fill="none"/>
  <circle cx="115" cy="115" r="30" fill="#245837" opacity="0.8"/>
  <!-- Palm silhouette 2 -->
  <path d="M560,220 Q550,150 520,120" stroke="#2d4a3e" stroke-width="6" fill="none"/>
  <circle cx="515" cy="115" r="30" fill="#245837" opacity="0.8"/>

  <!-- Coastal Drive Promenade Parking Pavement -->
  <polygon points="0,210 640,210 640,360 0,360" fill="#333e38"/>
  <line x1="100" y1="230" x2="170" y2="350" stroke="#ffffff" stroke-width="4"/>
  <line x1="240" y1="230" x2="310" y2="350" stroke="#ffffff" stroke-width="4"/>
  <line x1="380" y1="230" x2="450" y2="350" stroke="#ffffff" stroke-width="4"/>
  <line x1="520" y1="230" x2="590" y2="350" stroke="#ffffff" stroke-width="4"/>

  <text x="210" y="325" fill="#e6b422" font-family="monospace" font-size="14" font-weight="bold">PATENGA MARINE DRIVE PROMENADE</text>
</svg>
`)}`,

  // 6: Chawkbazar Market Area
  6: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
  <defs>
    <linearGradient id="chawkSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b9ccbf"/>
      <stop offset="100%" stop-color="#e3eee7"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#chawkSky)"/>

  <!-- Academic and Bazaar Urban Storefronts -->
  <rect x="40" y="90" width="140" height="120" fill="#586c5f" rx="3"/>
  <rect x="200" y="70" width="220" height="140" fill="#46584c" rx="3"/>
  <rect x="440" y="90" width="150" height="120" fill="#586c5f" rx="3"/>

  <!-- Paved Commercial Grid Parking Ground -->
  <polygon points="0,200 640,200 640,360 0,360" fill="#2b342d"/>
  <line x1="80" y1="220" x2="150" y2="350" stroke="#ffffff" stroke-width="4"/>
  <line x1="220" y1="220" x2="290" y2="350" stroke="#ffffff" stroke-width="4"/>
  <line x1="360" y1="220" x2="430" y2="350" stroke="#ffffff" stroke-width="4"/>
  <line x1="500" y1="220" x2="570" y2="350" stroke="#ffffff" stroke-width="4"/>

  <text x="195" y="325" fill="#ffffff" font-family="monospace" font-size="14" font-weight="bold">CHAWKBAZAR MUNICIPAL DOCK • SEC 01</text>
</svg>
`)}`,
};

export function getAreaImage(areaId: number): string {
  return PARKING_AREA_IMAGES[areaId] || HERO_PARKING_IMAGE;
}
