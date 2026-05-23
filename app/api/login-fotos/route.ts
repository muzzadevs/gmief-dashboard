import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dir = path.join(process.cwd(), "public", "loginFotos");
    
    if (!fs.existsSync(dir)) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const files = fs.readdirSync(dir).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    });

    const fotos = files.map((file) => `/loginFotos/${file}`);

    return NextResponse.json({ ok: true, data: fotos });
  } catch (error) {
    console.error("[GET /api/login-fotos] Error:", error);
    return NextResponse.json({ ok: true, data: [] });
  }
}
