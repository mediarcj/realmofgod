// File: apps/sanctuary/app/api/camera-calibration/route.ts
// Description: Reads and writes owner camera calibration records in local development.
// Purpose: Lets the calibration panel persist poses without placing them in source control.
// Notes: This route deliberately returns 404 in production.

import { NextResponse } from "next/server";
import { rename, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { emptyCalibrationFile, isCalibrationFile, type CalibrationFile } from "../../../lib/sanctuary/camera-calibration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const calibrationPath = join(process.cwd(), ".camera-calibration.local.json");
const unavailable = () => new NextResponse(null, { status: 404 });
const developmentOnly = () => process.env.NODE_ENV !== "production";

async function readCalibration(): Promise<CalibrationFile> {
  try {
    const parsed: unknown = JSON.parse(await readFile(calibrationPath, "utf8"));
    return isCalibrationFile(parsed) ? parsed : emptyCalibrationFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyCalibrationFile();
    throw error;
  }
}

export async function GET() {
  if (!developmentOnly()) return unavailable();
  try {
    return NextResponse.json(await readCalibration());
  } catch {
    return NextResponse.json({ error: "Could not read local camera calibration." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!developmentOnly()) return unavailable();
  let candidate: unknown;
  try { candidate = await request.json(); } catch { return NextResponse.json({ error: "Expected JSON." }, { status: 400 }); }
  if (!isCalibrationFile(candidate)) return NextResponse.json({ error: "Invalid calibration record." }, { status: 400 });
  const calibration: CalibrationFile = { ...candidate, updatedAt: new Date().toISOString() };
  const temporaryPath = `${calibrationPath}.${process.pid}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(calibration, null, 2)}\n`, "utf8");
    await rename(temporaryPath, calibrationPath);
    return NextResponse.json(calibration);
  } catch {
    return NextResponse.json({ error: "Could not write local camera calibration." }, { status: 500 });
  }
}
