import { getSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
    const supabase = await getSupabaseServerClient();

    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Logout error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Create response with redirect
        const response = NextResponse.json({ success: true });

        // Clear cookies
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
    }
}
