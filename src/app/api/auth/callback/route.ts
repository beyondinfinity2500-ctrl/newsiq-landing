import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/config/env";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const locale = searchParams.get("locale") ?? "en";

  if (code) {
    const supabase = createServerClient(env.supabase.url, env.supabase.anonKey, {
      cookies: {
        getAll() {
          return request.headers.get("cookie")
            ? request.headers.get("cookie")!.split("; ").map((c) => {
                const [name, ...rest] = c.split("=");
                return { name, value: rest.join("=") };
              })
            : [];
        },
        setAll() {},
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/${locale}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/login?error=auth`);
}
