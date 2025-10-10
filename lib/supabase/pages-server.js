import { createServerClient } from "@supabase/ssr";

export async function getSupabasePagesServerClient(context) {
    // context contains req and res from getServerSideProps
    const { req, res } = context;

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get: (name) => {
                    const cookies = req.cookies;
                    const cookie = cookies[name];
                    return cookie;
                },
                set: (name, value, options) => {
                    res.setHeader('Set-Cookie', `${name}=${value}; Path=/; ${options.maxAge ? `Max-Age=${options.maxAge};` : ''}`);
                },
                remove: (name, options) => {
                    res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0`);
                },
            },
        }
    );
}