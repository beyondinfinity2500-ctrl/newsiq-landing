/**
 * Image generation abstraction — provider-agnostic.
 *
 * NEWSIQ intentionally does NOT couple to a paid image-generation provider
 * at this stage. This module only defines the interface so a provider can
 * be plugged in later (e.g. DALL·E, Flux, Stable Diffusion) without
 * touching call sites.
 *
 * Style contract for any future provider (editorial, not decorative):
 *   - dark, cinematic, minimal, premium
 *   - geographically / contextually accurate to the article
 *   - no embedded headline text, no logos
 */

import type { ImageSourceMetadata } from "./types";

export interface ImageGenerationRequest {
  /** Editorial subject of the article (entities, region, theme). */
  subject: string;
  /** Article locale (kept out of the image itself; used for context only). */
  locale: string;
  /** Optional article headline for provider context — never rendered as text in the image. */
  headline?: string;
  /** Desired master width (px). */
  width?: number;
  height?: number;
}

export interface GeneratedImage {
  /** URL of the stored master image (Supabase Storage or CDN). */
  url: string;
  /** Semantic, stable filename without extension. */
  filename: string;
  /** Provenance metadata stored alongside the article. */
  metadata: ImageSourceMetadata;
}

export interface ImageProvider {
  readonly name: string;
  /** True when credentials/config for this provider are present. */
  isConfigured(): boolean;
  generate(request: ImageGenerationRequest): Promise<GeneratedImage>;
}

/**
 * Placeholder provider: reports as unconfigured and always rejects.
 * Call sites must handle this gracefully (fall back to manual/external
 * imagery). Swapping in a real provider later only requires replacing
 * this object — no UI or data-access changes.
 */
export const noOpImageProvider: ImageProvider = {
  name: "none",
  isConfigured() {
    return false;
  },
  async generate() {
    throw new Error(
      "No image generation provider configured. Set NEWSIQ_IMAGE_PROVIDER_* env vars and register a provider in src/lib/image/provider.ts."
    );
  },
};