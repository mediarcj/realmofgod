// File: apps/sanctuary/app/api/lookdev-calibration/route.ts
// Description: Reads and writes the local development lookdev profile.
// Purpose: Persists human browser lighting calibration without committing it.
// Notes: The route is unavailable in production.

import { NextResponse } from "next/server";
import { rename, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defaultLookdev, isLookdevProfile, type LookdevProfile } from "../../../lib/sanctuary/lookdev";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const profilePath = join(process.cwd(), ".lookdev-calibration.local.json");
const available = () => process.env.NODE_ENV !== "production";
export async function GET() {
  if (!available()) return new NextResponse(null, { status: 404 });
  try { const value: unknown = JSON.parse(await readFile(profilePath, "utf8")); return NextResponse.json(isLookdevProfile(value) ? value : defaultLookdev); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return NextResponse.json(defaultLookdev); return NextResponse.json({ error: "Could not read local lookdev profile." }, { status: 500 }); }
}
export async function POST(request: Request) {
  if (!available()) return new NextResponse(null, { status: 404 });
  let value: unknown; try { value = await request.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
  if (!isLookdevProfile(value)) return NextResponse.json({ error: "Invalid lookdev profile." }, { status: 400 });
  const temporary = `${profilePath}.${process.pid}.tmp`;
  try { await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8"); await rename(temporary, profilePath); return NextResponse.json(value); }
  catch { return NextResponse.json({ error: "Could not write local lookdev profile." }, { status: 500 }); }
}
