// Re-export the locale-aware navigation helpers at `@/i18n` so the rest
// of the codebase can write `import { Link } from "@/i18n"`.
export { Link, redirect, usePathname, useRouter, getPathname } from "./navigation";
