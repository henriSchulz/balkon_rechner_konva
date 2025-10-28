// Regel III: Korrekte und vollständige Liste der verfügbaren Festlängen

import { PRODUCTS } from "../utils/api";




export const BODENPROFILE_LAENGEN_MM = PRODUCTS.S.map(e => e.length);

// Regel II: Feste Deckbreite des Profils
export const BODENPROFIL_BREITE_MM = {
    S: 140,
    L: 200,
};

// Regel IV: Zwingend einzuhaltender Randabstand
export const RANDABSTAND_MM = 10;