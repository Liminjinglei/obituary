import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import crypto from "crypto";

function safeEqual(a: string, b: string) {
  // timing attack 방지용(필수는 아니지만 안전)
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params;
  const noticeId = p.id;

  const url = new URL(req.url);
  const inputKey = (url.searchParams.get("deleteKey") || "").trim();

  if (!inputKey) {
    return NextResponse.json({ error: "삭제키가 필요합니다." }, { status: 400 });
  }

  const masterKey = (process.env.MASTER_DELETE_KEY || "").trim();

  const { data, error: readErr } = await supabaseServer
    .from("notices")
    .select("id, delete_key")
    .eq("id", noticeId)
    .single();

  if (readErr) return NextResponse.json({ error: "조회 실패: " + readErr.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "부고장을 찾을 수 없습니다." }, { status: 404 });

  const okByNormalKey = safeEqual(String(data.delete_key), inputKey);
  const okByMasterKey = masterKey ? safeEqual(masterKey, inputKey) : false;

  if (!okByNormalKey && !okByMasterKey) {
    return NextResponse.json({ error: "삭제키가 올바르지 않습니다." }, { status: 403 });
  }

  const { error: delErr } = await supabaseServer.from("notices").delete().eq("id", noticeId);
  if (delErr) return NextResponse.json({ error: "삭제 실패: " + delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, used: okByMasterKey ? "master" : "normal" });
}
