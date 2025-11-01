import { PRODUCTS } from "../utils/api";

export const BODENPROFILE_LAENGEN_MM = Array.from(new Set(PRODUCTS.S.map(e => e.length))).sort((a,b) => a - b);

// Regel II: Feste Deckbreite des Profils
export const BODENPROFIL_BREITE_MM = {
    S: 140,
    L: 200,
};

// Regel IV: Zwingend einzuhaltender Randabstand
export const RANDABSTAND_MM = 0;

// NEU: Zwingender Überstand (Verschnitt) für schräge Kanten
export const ZUSCHNITT_TOLERANZ_MM = 2;