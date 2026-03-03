/**
 * Flux AI Integration Library & Prompt Engineering Engine
 */

interface FluxGenerationOptions {
    prompt: string;
    width?: number;
    height?: number;
    seed?: number;
    enhance?: boolean;
    nologo?: boolean;
    safe?: boolean;
}

export const FLUX_DEFAULTS = {
    width: 1280,
    height: 720,
    enhance: true,
    nologo: true,
    safe: false,
};

// === PROMPT ENGINEERING ENGINE ===

// === FLUX PROMPT ENGINEERING ENGINE (Minimalist & Direct) ===

// High-impact keywords only, no fluff
const STYLES = [
    "photorealistic, cinematic composition",
    "architectural digest style, luxury",
    "cyberpunk aesthetic, neon lighting",
    "national geographic nature style",
    "editorial fashion, vogue style",
    "macro photography, extreme detail",
    "3d render, unreal engine 5",
    "anime style, vibrant colors",
    "dark fantasy, intricate details"
];

const QUALITY_BOOSTERS = [
    "8k", "sharp focus", "highly detailed", "perfect lighting", "hdr"
];

/**
 * Transforms input into a clean, direct prompt optimized for Schnell/Turbo.
 * "Simpler is better."
 */
export function enhancePromptSystem(basePrompt: string): { finalPrompt: string; modifiers: string[] } {
    // Random style to add flavor without overwhelming
    const style = STYLES[Math.floor(Math.random() * STYLES.length)];

    // Construct a simpler prompt: Subject + Style + Quality
    // No "A image of...", just direct tokens.
    const finalPrompt = `${basePrompt}, ${style}, ${QUALITY_BOOSTERS.join(", ")}`;

    return {
        finalPrompt,
        modifiers: [style, ...QUALITY_BOOSTERS]
    };
}

/**
 * Generates a completely random "Surprise Me" prompt for interior design/architecture.
 */
export function generateSurprisePrompt(): string {
    const subjects = [
        "luxury minimalist living room with floor-to-ceiling windows overlooking a forest",
        "futuristic kitchen with floating islands and neon accents",
        "cozy reading nook in a loft apartment with exposed brick walls",
        "zen garden inspired bathroom with natural stone and bamboo",
        "industrial chic office space with metal beams and warm lighting",
        "cyberpunk street food stall in a rainy neo-tokyo alley",
        "parametric architecture skyscraper lobby with organic shapes"
    ];

    const base = subjects[Math.floor(Math.random() * subjects.length)];
    const { finalPrompt } = enhancePromptSystem(base);
    return finalPrompt;
}

export function generateFluxImageUrl(options: FluxGenerationOptions): string {
    const {
        prompt,
        width = FLUX_DEFAULTS.width,
        height = FLUX_DEFAULTS.height,
        seed = Math.floor(Math.random() * 1000000),
        enhance = FLUX_DEFAULTS.enhance,
        nologo = FLUX_DEFAULTS.nologo,
        safe = FLUX_DEFAULTS.safe,
    } = options;

    // Use local proxy to handle validation and placeholder rejection
    const baseUrl = "/api/flux-proxy";
    const params = new URLSearchParams();

    params.append("prompt", prompt);
    // Request the preferred model, proxy will fallback if needed
    params.append("model", "flux-realism");
    params.append("width", width.toString());
    params.append("height", height.toString());
    params.append("seed", seed.toString());

    return `${baseUrl}?${params.toString()}`;
}
