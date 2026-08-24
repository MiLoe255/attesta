#!/usr/bin/env node
/** Ausfuehrbarer Einstiegspunkt. Ruft den Dispatch aus index.ts auf und setzt den Prozess-Rueckgabewert. */
import { fuehreAusMitFehlerbehandlung } from "./index";

process.exitCode = fuehreAusMitFehlerbehandlung(process.argv.slice(2));
