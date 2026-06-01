import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL obrigatória" }, { status: 400 });

  const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
  if (!res.ok) return NextResponse.json({ error: "Erro ao encurtar" }, { status: 500 });

  const short = await res.text();
  return NextResponse.json({ short: short.trim() });
}
