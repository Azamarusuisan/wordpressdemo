// Section Template Type
export interface SectionTemplate {
    type: string;
    name: string;
    icon: string;
    description: string;
}

// Section Templates for LP Builder
export const SECTION_TEMPLATES: SectionTemplate[] = [
    { type: 'hero', name: 'ヒーロー', icon: '🎯', description: 'メインビジュアルエリア' },
    { type: 'features', name: '特徴', icon: '✨', description: '製品の特徴' },
    { type: 'pricing', name: '価格', icon: '💰', description: '料金プラン' },
    { type: 'faq', name: 'FAQ', icon: '❓', description: 'よくある質問' },
    { type: 'cta', name: 'CTA', icon: '🚀', description: '行動喚起' },
    { type: 'testimonials', name: 'お客様の声', icon: '💬', description: 'ユーザーレビュー' },
];
