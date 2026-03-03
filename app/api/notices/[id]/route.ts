import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params;
  const noticeId = p.id;

  const url = new URL(req.url);
  const deleteKey = (url.searchParams.get("deleteKey") || "").trim();

  if (!deleteKey) {
    return NextResponse.json({ error: "deleteKey가 필요합니다." }, { status: 400 });
  }

  const { data, error: readErr } = await supabaseServer
    .from("notices")
    .select("id, delete_key")
    .eq("id", noticeId)
    .single();

  if (readErr) {
    return NextResponse.json({ error: "조회 실패: " + readErr.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "부고장을 찾을 수 없습니다." }, { status: 404 });
  }

  if (data.delete_key !== deleteKey) {
    return NextResponse.json({ error: "삭제키가 올바르지 않습니다." }, { status: 403 });
  }

  const { error: delErr } = await supabaseServer.from("notices").delete().eq("id", noticeId);

  if (delErr) {
    return NextResponse.json({ error: "삭제 실패: " + delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
