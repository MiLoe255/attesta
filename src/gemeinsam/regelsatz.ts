/**
 * Laedt das private Paket @miloe255/attesta-core. Einzige Stelle, an der
 * attesta das Regelsatzpaket importiert (G1-Grenze, siehe Leitfaden 2.4:
 * die Einbahnstrasse).
 */
export { ladeProfilBasis, pruefsumme, PROFIL_DATEINAMEN, ladeRollen, ladeUnschaerfe, ladeTechnologien, ladeKsMatrix, ladeDelegationsreife, ladeNotfall } from "@miloe255/attesta-core";
export type { ProfilBasis, ProfilBasisDatei, ProfilDateiname, Rollen, Rolle, Unschaerfe, UnschaerfeWort, Technologien } from "@miloe255/attesta-core";
