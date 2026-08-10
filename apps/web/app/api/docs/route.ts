import { NextRequest, NextResponse } from "next/server";
import pool, { ensureTable } from "@/lib/db";

export async function GET() {
  try {
    await ensureTable();
    const result = await pool.query(
      "SELECT id, title, created_at, updated_at FROM documents ORDER BY updated_at DESC"
    );
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const { title, content } = await req.json();
    const result = await pool.query(
      "INSERT INTO documents (title, content) VALUES ($1, $2) RETURNING id, title, content, created_at, updated_at",
      [title || "Untitled", content || ""]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
