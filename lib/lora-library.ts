/**
 * LoRA Model Library for FLUX.1-dev
 *
 * Curated LoRA models optimized for concert and venue photography.
 * Compatible with fal.ai flux-lora endpoint.
 */

export type LoRAWeight = {
  path: string
  scale: number
}

export type LoRAModel = {
  id: string
  name: string
  path: string
  description: string
  recommendedScale: number
  category: 'realism' | 'cinematic' | 'concert' | 'photography'
  triggerWords?: string[]
  bestFor: string[]
}

export const LORA_MODELS: LoRAModel[] = [
  // Concert & Stage Lighting
  {
    id: 'edm-festival-stage',
    name: 'EDM Festival Stage',
    path: 'Purz/edm-festival-stage',
    description: 'Trained on professional EDM festival stage photographs with complex lighting rigs',
    recommendedScale: 1.0,
    category: 'concert',
    triggerWords: ['3dm_f35t1v47'],
    bestFor: ['Stage close-ups', 'Lighting rigs', 'Concert production', 'Festival stages']
  },

  // Photorealism
  {
    id: 'xlabs-realism',
    name: 'XLabs Realism LoRA',
    path: 'XLabs-AI/flux-RealismLora',
    description: 'Official realism enhancement for FLUX.1-dev, improves photographic quality',
    recommendedScale: 0.8,
    category: 'realism',
    bestFor: ['Overall realism', 'Professional photography', 'Natural lighting', 'Crowd shots']
  },

  {
    id: 'super-realism',
    name: 'Super Realism',
    path: 'strangerzonehf/Flux-Super-Realism-LoRA',
    description: 'High-quality photorealism with particular strength in portraits and crowd scenes',
    recommendedScale: 1.0,
    category: 'realism',
    triggerWords: ['Super Realism'],
    bestFor: ['Hyper-realistic photos', 'Portrait photography', 'Close-up shots', 'Detail enhancement']
  },

  {
    id: 'canopus-ultra',
    name: 'Canopus UltraRealism 2.0',
    path: 'prithivMLmods/Canopus-LoRA-Flux-UltraRealism-2.0',
    description: 'Trained on 70 high-resolution images for ultra-realistic photography',
    recommendedScale: 0.9,
    category: 'realism',
    triggerWords: ['Ultra realistic'],
    bestFor: ['Ultra-realistic photos', 'High detail', 'Professional quality', 'Venue photography']
  },

  // Cinematic Lighting
  {
    id: 'kontext-ultimate',
    name: 'Flux Kontext Ultimate',
    path: 'strangerzonehf/Flux-Kontext-Ultimate-LoRA',
    description: 'Advanced cinematic lighting with dramatic film-grade results and mood adaptation',
    recommendedScale: 0.7,
    category: 'cinematic',
    bestFor: ['Dramatic lighting', 'Artistic shots', 'Film-grade quality', 'Mood enhancement']
  },

  // Photography Enhancement
  {
    id: 'flux-photography',
    name: 'Flux Photography',
    path: 'imagepipeline/Flux-Realism-LoRA',
    description: 'General photography enhancement with improved composition and lighting',
    recommendedScale: 0.8,
    category: 'photography',
    bestFor: ['Professional photography', 'Composition', 'General enhancement', 'Venue shots']
  }
]

// Red Rocks Section Presets
export type VenuePreset = {
  id: string
  name: string
  description: string
  loras: LoRAWeight[]
  recommendedPromptAdditions: string
  venueSection?: string
}

export const RED_ROCKS_PRESETS: VenuePreset[] = [
  {
    id: 'red-rocks-main-stage',
    name: 'Red Rocks - Main Stage View',
    description: 'Optimized for stage close-ups with dramatic lighting and production elements',
    loras: [
      { path: 'XLabs-AI/flux-RealismLora', scale: 0.8 },
      { path: 'Purz/edm-festival-stage', scale: 1.0 }
    ],
    recommendedPromptAdditions: '3dm_f35t1v47, professional concert photography, stage lighting',
    venueSection: 'Stage View'
  },

  {
    id: 'red-rocks-crowd-front',
    name: 'Red Rocks - Front Section Crowd',
    description: 'Captures crowd energy from front sections with stage visibility',
    loras: [
      { path: 'strangerzonehf/Flux-Super-Realism-LoRA', scale: 1.0 },
      { path: 'XLabs-AI/flux-RealismLora', scale: 0.7 }
    ],
    recommendedPromptAdditions: 'Super Realism, concert crowd, energetic atmosphere, professional photography',
    venueSection: 'Front Rows'
  },

  {
    id: 'red-rocks-mid-section',
    name: 'Red Rocks - Mid-Section Perspective',
    description: 'Balanced view of stage and crowd with natural rock formations',
    loras: [
      { path: 'prithivMLmods/Canopus-LoRA-Flux-UltraRealism-2.0', scale: 0.9 },
      { path: 'Purz/edm-festival-stage', scale: 0.8 }
    ],
    recommendedPromptAdditions: 'Ultra realistic, Red Rocks amphitheater, natural rock formations, concert atmosphere',
    venueSection: 'Mid-Section'
  },

  {
    id: 'red-rocks-upper-rows',
    name: 'Red Rocks - Upper Rows Wide Shot',
    description: 'Sweeping view capturing venue scale, crowd, and Colorado landscape',
    loras: [
      { path: 'XLabs-AI/flux-RealismLora', scale: 0.9 },
      { path: 'strangerzonehf/Flux-Kontext-Ultimate-LoRA', scale: 0.6 }
    ],
    recommendedPromptAdditions: 'professional photography, wide angle, dramatic lighting, Colorado landscape',
    venueSection: 'Upper Rows'
  },

  {
    id: 'red-rocks-artistic',
    name: 'Red Rocks - Artistic/Cinematic',
    description: 'Dramatic, film-grade concert photography with artistic lighting',
    loras: [
      { path: 'strangerzonehf/Flux-Kontext-Ultimate-LoRA', scale: 0.8 },
      { path: 'strangerzonehf/Flux-Super-Realism-LoRA', scale: 0.7 }
    ],
    recommendedPromptAdditions: 'Super Realism, cinematic lighting, dramatic atmosphere, artistic concert photography',
    venueSection: 'Any'
  }
]

// Helper functions
export function getLoRAById(id: string): LoRAModel | undefined {
  return LORA_MODELS.find(lora => lora.id === id)
}

export function getLoRAsByCategory(category: LoRAModel['category']): LoRAModel[] {
  return LORA_MODELS.filter(lora => lora.category === category)
}

export function getPresetById(id: string): VenuePreset | undefined {
  return RED_ROCKS_PRESETS.find(preset => preset.id === id)
}

export function getPresetsByVenueSection(section: string): VenuePreset[] {
  return RED_ROCKS_PRESETS.filter(preset =>
    preset.venueSection === section || preset.venueSection === 'Any'
  )
}
