// Only use this file in app directory components!

export async function getServerSideAuth() {
    const { getSupabaseServerClient } = await import("./supabase/server");
    const supabase = await getSupabaseServerClient();
    return await supabase.auth.getSession();
}