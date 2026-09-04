import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";

export function GET() { return NextResponse.json({ status: "ok", service: siteConfig.name, timestamp: new Date().toISOString() }); }
