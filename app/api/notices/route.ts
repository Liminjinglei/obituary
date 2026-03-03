import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { EXPIRE_DAYS, RATE_LIMIT_PER_HOUR } from "@/lib/config";
import { randomDeleteKey, randomId } from "@/lib/ids";

function getClientIp(h: Headers) {
  const xf = h.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}

type AccountItem = { bank: string; number: string; holder?: string };
type BereavedItem = { seq?: number; role: string; name: string; phone?: string; accounts?: AccountItem[] };

function sanitizeAccounts(input: any): AccountItem[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const out: AccountItem[] = [];

  for (const raw of input) {
    const bank = String(raw?.bank ?? "").trim();
    const number = String(raw?.number ?? "").trim();
    const holder = String(raw?.holder ?? "").trim();
    if (!bank || !number) continue;

    out.push({ bank, number, holder: holder || undefined });
    if (out.length >= 5) break;
  }
  return out.length ? out : undefined;
}

function sanitizeBereavedList(input: any): BereavedItem[] | null {
  if (!Array.isArray(input)) return null;
  const out: BereavedItem[] = [];

  for (const raw of input) {
    const role = String(raw?.role ?? "").trim();
    const name = String(raw?.name ?? "").trim();
    const phone = String(raw?.phone ?? "").trim();
    const seqRaw = raw?.seq;

    if (!role || !name) continue;

    const seq = Number.isFinite(Number(seqRaw)) ? Number(seqRaw) : undefined;
    const accounts = sanitizeAccounts(raw?.accounts);

    out.push({
      seq,
      role,
      name,
      phone: phone || undefined,
      accounts,
    });

    if (out.length >= 20) break; // 상주 최대 20명
  }

  return out.length ? out : null;
}

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const ua = req.headers.get("user-agent") || "";

  const body = await req.json().catch(() => ({}));

  const deceasedName = String(body.deceasedName || "").trim();
  const funeralHome = String(body.funeralHome || "").trim();
  const room = String(body.room || "").trim();
  const mapUrl = String(body.mapUrl || "").trim();
  const message = String(body.message || "").trim();

  const deceasedAgeRaw = body.deceasedAge;
  const deceasedAge =
    deceasedAgeRaw === undefined || deceasedAgeRaw === null || String(deceasedAgeRaw).trim() === ""
      ? null
      : Number(deceasedAgeRaw);

  const bereavedList = sanitizeBereavedList(body.bereavedList);

  if (!deceasedName || !funeralHome) {
    return NextResponse.json({ error: "고인 성함과 장례식장은 필수입니다." }, { status: 400 });
  }

  if (deceasedAge !== null && (!Number.isFinite(deceasedAge) || deceasedAge < 0 || deceasedAge > 120)) {
    return NextResponse.json({ error: "고인 나이는 0~120 범위의 숫자만 가능합니다." }, { status: 400 });
  }

  // 1시간당 생성 제한
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabaseServer
    .from("notices")
    .select("*", { count: "exact", head: true })
    .eq("created_ip", ip)
    .gte("created_at", since);

  if ((count || 0) >= RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      { error: `생성 제한: 같은 네트워크에서 1시간에 최대 ${RATE_LIMIT_PER_HOUR}개까지 생성 가능합니다.` },
      { status: 429 }
    );
  }

  const summary = `${funeralHome}${room ? ` · ${room}` : ""}`;
  const expiresAt = new Date(Date.now() + EXPIRE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const id = randomId(10);
  const deleteKey = randomDeleteKey(18);

  const { error } = await supabaseServer.from("notices").insert({
    id,
    deceased_name: deceasedName,
    deceased_age: deceasedAge,
    funeral_home: funeralHome,
    room: room || null,
    summary,
    map_url: mapUrl || null,
    message: message || null,
    bereaved_list: bereavedList,
    delete_key: deleteKey,
    expires_at: expiresAt,
    created_ip: ip,
    created_ua: ua,
  });

  if (error) {
    return NextResponse.json({ error: "DB 저장 실패: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ id, deleteKey, expiresAt });
}
