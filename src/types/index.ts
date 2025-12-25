// ========================================
// Core Types for LP Builder
// ========================================

// Section Types
export type SectionType = 'hero' | 'features' | 'pricing' | 'faq' | 'cta' | 'testimonials';

export interface SectionProperties {
    title?: string;
    subtitle?: string;
    description?: string;
    text?: string;
    backgroundColor?: string;
    textColor?: string;
}

export interface SectionImage {
    id: number;
    filePath: string;
    width?: number | null;
    height?: number | null;
    mime: string;
    prompt?: string | null;
}

export interface Section {
    id: string;
    type: SectionType;
    name: string;
    role: string;
    order: number;
    imageId?: number | null;
    image?: SectionImage | null;
    config?: SectionProperties | null;
    properties?: SectionProperties;
}

// Page Types
export type PageStatus = 'draft' | 'published';

export interface Page {
    id: number;
    userId?: string | null;
    title: string;
    slug: string;
    status: PageStatus;
    templateId: string;
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
    sections?: Section[];
}

export interface PageListItem {
    id: number;
    title: string;
    slug: string;
    status: PageStatus;
    isFavorite: boolean;
    updatedAt: string;
    sections?: Array<{
        image?: {
            filePath: string;
        } | null;
    }>;
}

// Header/Navigation Types
export interface NavItem {
    id: string;
    label: string;
    href: string;
}

export interface HeaderConfig {
    logoText: string;
    sticky: boolean;
    ctaText: string;
    ctaLink: string;
    navItems: NavItem[];
}

// Media Types
export interface MediaImage {
    id: number;
    userId?: string | null;
    filePath: string;
    width?: number | null;
    height?: number | null;
    mime: string;
    prompt?: string | null;
    hash?: string | null;
    sourceUrl?: string | null;
    sourceType?: 'import' | 'ai-generate' | 'upload' | null;
    createdAt: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// Generation Types
export type GenerationType =
    | 'copy'
    | 'image'
    | 'inpaint'
    | 'edit-image'
    | 'prompt-copilot'
    | 'review'
    | 'image-to-prompt'
    | 'generate-nav'
    | 'chat-edit'
    | 'lp-generate';

export interface GenerationRun {
    id: number;
    userId?: string | null;
    type: GenerationType;
    endpoint?: string | null;
    model: string;
    inputPrompt: string;
    outputResult?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    imageCount?: number | null;
    estimatedCost?: number | null;
    status: 'succeeded' | 'failed';
    errorMessage?: string | null;
    durationMs?: number | null;
    createdAt: string;
}

// User Types
export type UserPlan = 'normal' | 'premium';

export interface UserSettings {
    id: number;
    userId: string;
    email?: string | null;
    plan: UserPlan;
    googleApiKey?: string | null;
    createdAt: string;
    updatedAt: string;
}

// Business Info for LP Generation
export interface BusinessInfo {
    businessName: string;
    service: string;
    target: string;
    strength: string;
    price?: string;
    style: 'professional' | 'pops' | 'luxury' | 'minimal' | 'emotional';
}

// LP Builder Section (for editing)
export interface LPSection {
    id: string;
    type: string;
    name: string;
    properties: {
        title?: string;
        subtitle?: string;
        description?: string;
        image?: string;
        backgroundColor?: string;
        textColor?: string;
        [key: string]: unknown;
    };
    imageId?: number | null;
}

// Existing Page for Page Selector
export interface ExistingPage {
    id: number;
    title: string;
    slug: string;
    status: string;
    updatedAt: string;
    sections: unknown[];
}

// Stats Types
export interface UsageStats {
    period: {
        days: number;
        startDate: string;
        endDate: string;
    };
    summary: {
        totalCalls: number;
        totalCost: number;
        totalInputTokens: number;
        totalOutputTokens: number;
        totalImages: number;
        avgDurationMs: number;
    };
    daily: Array<{
        date: string;
        count: number;
        cost: number;
        errors: number;
    }>;
    byModel: Array<{
        model: string;
        count: number;
        cost: number;
        images: number;
    }>;
    byType: Array<{
        type: string;
        count: number;
        cost: number;
        images: number;
    }>;
    errorRate: {
        total: number;
        failed: number;
        rate: number;
    };
}
