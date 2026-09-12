import { compileSpace } from "@/space/compileSpace";
import { NOCTURNE } from "@/space/nocturne";

/** Computed once at module load — compileSpace is pure and the spec never changes
 * at runtime, so there's no reason to redo this per render. */
export const NOCTURNE_COMPILED = compileSpace(NOCTURNE);
