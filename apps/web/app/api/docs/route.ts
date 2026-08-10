import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://docuflow:docuflow@database:5432/docuflow?sslmode=disable",
});

export async function GET() {
  try {
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
    const body = await req.json();
    const title = body.title || "Untitled";
    const content = body.content || "";
    const result = await pool.query(
      "INSERT INTO documents (title, content) VALUES ($1, $2) RETURNING id, title, content, created_at, updated_at",
      [title, content]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error("POST /api/docs error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
