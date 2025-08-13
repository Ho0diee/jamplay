import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = { matcher: [] };
