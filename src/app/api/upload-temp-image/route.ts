import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    // ユーザー認証
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 画像ファイルのみ許可
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files allowed' }, { status: 400 });
    }

    // 5MB制限
    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage (temp folder)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.name.split('.').pop() || 'png';
    const finalFilename = `temp/${user.id}/${uniqueSuffix}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('images')
        .upload(finalFilename, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get Public URL
    const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('images')
        .getPublicUrl(finalFilename);

    return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: finalFilename,
    });
}
