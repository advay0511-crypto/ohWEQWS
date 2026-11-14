/**
 * Standard card styles matching the Home page design
 * and slightly greener gradients for cards using AI data.
 */

// Exact standard card style with noticeable translucent 3-color gradient blending with the theme
export const CARD_BASE =
  'rounded-2xl bg-gradient-to-br from-[#27D7B2]/[0.14] via-[#12887A]/[0.08] to-[#04141A]/[0.38] backdrop-blur-md border border-white/[0.14] text-[#F0F7FA] shadow-lg transition-all';

// Subtle hover state for interactive cards
export const CARD_BASE_INTERACTIVE =
  'rounded-2xl bg-gradient-to-br from-[#27D7B2]/[0.14] via-[#12887A]/[0.08] to-[#04141A]/[0.38] backdrop-blur-md border border-white/[0.14] hover:border-[#27D7B2]/50 hover:from-[#27D7B2]/[0.22] hover:to-[#041820]/[0.46] text-[#F0F7FA] shadow-lg hover:shadow-[0_0_25px_rgba(39,215,178,0.20)] transition-all cursor-pointer';

// Cards that display AI-generated insights, agronomic rationale, or AI scoring
export const CARD_AI =
  'rounded-2xl bg-gradient-to-br from-[#27D7B2]/[0.16] via-[#12887A]/[0.09] to-[#04141A]/[0.40] backdrop-blur-md border border-[#27D7B2]/40 shadow-[0_0_24px_rgba(39,215,178,0.12)] text-[#F0F7FA] transition-all';

// Interactive AI card
export const CARD_AI_INTERACTIVE =
  'rounded-2xl bg-gradient-to-br from-[#27D7B2]/[0.16] via-[#12887A]/[0.09] to-[#04141A]/[0.40] backdrop-blur-md border border-[#27D7B2]/40 hover:border-[#27D7B2]/65 hover:shadow-[0_0_30px_rgba(39,215,178,0.22)] text-[#F0F7FA] transition-all cursor-pointer';

// AI badge indicator
export const BADGE_AI =
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#27D7B2]/15 text-[#27D7B2] border border-[#27D7B2]/35';
