import { palette, uiColors } from '@/utils/theme';

export const homeMapPinSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pinGradient" x1="250" y1="90" x2="790" y2="940" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${uiColors.mapPin.gradientStart}"/>
      <stop offset="0.28" stop-color="${uiColors.mapPin.gradientMidWarm}"/>
      <stop offset="0.62" stop-color="${uiColors.mapPin.gradientMidPrimary}"/>
      <stop offset="1" stop-color="${uiColors.mapPin.gradientEnd}"/>
    </linearGradient>
    <linearGradient id="pinShade" x1="512" y1="190" x2="790" y2="920" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${uiColors.mapPin.gradientMidWarm}" stop-opacity="0.15"/>
      <stop offset="0.55" stop-color="${uiColors.mapPin.shadeMid}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${uiColors.mapPin.shadeEnd}" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="houseGradient" x1="370" y1="230" x2="660" y2="525" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${uiColors.mapPin.houseStart}"/>
      <stop offset="0.45" stop-color="${uiColors.mapPin.houseMid}"/>
      <stop offset="1" stop-color="${uiColors.mapPin.houseEnd}"/>
    </linearGradient>
    <radialGradient id="pinHighlight" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(334 142) rotate(56) scale(360 360)">
      <stop offset="0" stop-color="${uiColors.mapPin.highlightStart}" stop-opacity="0.55"/>
      <stop offset="0.52" stop-color="${uiColors.mapPin.highlightMid}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${uiColors.mapPin.highlightMid}" stop-opacity="0"/>
    </radialGradient>
    <filter id="softShadow" x="260" y="85" width="520" height="520" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="${uiColors.mapPin.shadow}" flood-opacity="0.18"/>
    </filter>
  </defs>
  <path d="M512 966 C501 966 495 954 489 944 L256 555 C222 501 203 438 203 376 C203 206 341 68 512 68 C683 68 821 206 821 376 C821 438 802 501 768 555 L535 944 C529 954 523 966 512 966Z" fill="url(#pinGradient)"/>
  <path d="M512 966 C523 966 529 954 535 944 L768 555 C802 501 821 438 821 376 C821 206 683 68 512 68 L512 966Z" fill="url(#pinShade)" opacity="0.55"/>
  <path d="M512 966 C501 966 495 954 489 944 L256 555 C222 501 203 438 203 376 C203 206 341 68 512 68 C683 68 821 206 821 376 C821 438 802 501 768 555 L535 944 C529 954 523 966 512 966Z" fill="url(#pinHighlight)" opacity="0.75"/>
  <circle cx="512" cy="374" r="237" fill="${uiColors.mapPin.innerGlow}" opacity="0.55"/>
  <circle cx="512" cy="374" r="219" fill="${palette.light.card}" filter="url(#softShadow)"/>
  <path d="M372 356 C363 356 356 349 356 340 C356 335 358 331 362 328 L498 204 C506 197 518 197 526 204 L580 253 L580 234 C580 225 587 218 596 218 L623 218 C632 218 639 225 639 234 L639 306 L662 328 C666 332 668 336 668 341 C668 350 661 357 652 357 L627 357 L627 472 C627 482 619 490 609 490 L563 490 C553 490 546 482 546 472 L546 398 C546 390 540 384 532 384 L492 384 C484 384 478 390 478 398 L478 472 C478 482 470 490 460 490 L414 490 C404 490 396 482 396 472 L396 357 L372 356Z" fill="url(#houseGradient)"/>
</svg>
`;
