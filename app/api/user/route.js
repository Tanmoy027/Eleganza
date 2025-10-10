import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await getSupabaseServerClient();

    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return Response.json({ error: error?.message || 'Not authenticated' }, { status: 401 });
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // Get recent orders (limit to 5 most recent)
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        // If profile doesn't exist, create it
        if (profileError && profileError.code === 'PGRST116') {
            const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || '',
                    role: 'user'
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error creating profile:', insertError);
            } else {
                return Response.json({
                    user,
                    profile: newProfile,
                    orders: orders || []
                });
            }
        }

        return Response.json({
            user,
            profile: profile || null,
            orders: orders || []
        });
    } catch (error) {
        console.error("API error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}