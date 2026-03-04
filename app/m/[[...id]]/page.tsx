import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabaseServer";
import { SITE_URL } from "@/lib/config";
import DeleteBoxClient from "@/components/DeleteBoxClient";
import CopyLinkButton from "@/components/CopyLinkButton";
import AccountsToggle from "@/components/AccountsToggle";
import FitLine from "@/components/FitLine";

type AccountItem = { bank: string; number: string; holder?: string };
type BereavedItem = {
  seq?: number;
  gid?: string;
  attachTo?: string;
  role: string;
  name: string;
  phone?: string;
  accounts?: AccountItem[];
};

type Notice = {
  id: string;
  deceased_name: string;
  deceased_age: number | null;
  funeral_home: string;
  room: string | null;
  summary: string | null;
  map_url: string | null;
  message: string | null;
  bereaved_list: BereavedItem[] | null;
  expires_at: string;
  created_at: string;
};

function roleRank(role: string): number {
  const r = role.trim();
  const map: Record<string, number> = {
    "부(父)": 0,
    "모(母)": 1,
    "배우자": 10,
    "아들": 20,
    "딸": 21,
    "자부": 22,
    "사위": 23,
    "손자": 30,
    "손녀": 31,
    "외손자": 32,
    "외손녀": 33,
    "손부": 34,
    "손서": 35,
    "외손부": 36,
    "외손서": 37,
    "형(兄)": 40,
    "오빠": 41,
    "누나": 42,
    "언니": 43,
    "남동생": 44,
    "여동생": 45,
    "백부": 50,
    "백모": 51,
    "숙부": 52,
    "숙모": 53,
    "고모": 54,
    "이모": 55,
    "형수": 56,
    "제수": 57,
    "매형": 58,
    "매제": 59,
    "기타": 99,
  };
  return map[r] ?? 98;
}

function seqNum(x: any) {
  return Number.isFinite(Number(x)) ? Number(x) : 9999;
}

function sortGeneral(list: BereavedItem[]) {
  return [...list].sort((a, b) => {
    const ra = roleRank(a.role);
    const rb = roleRank(b.role);
    if (ra !== rb) return ra - rb;
    return seqNum(a.seq) - seqNum(b.seq);
  });
}

async function getNotice(id: string): Promise<Notice | null> {
  const { data } = await supabaseServer
    .from("notices")
    .select(
      "id,deceased_name,deceased_age,funeral_home,room,summary,map_url,message,bereaved_list,expires_at,created_at"
    )
    .eq("id", id)
    .single();

  if (!data) return null;

  const exp = new Date(data.expires_at).getTime();
  if (Number.isNaN(exp)) return null;
  if (exp <= Date.now()) return null;

  return data as Notice;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id?: string[] }>;
}): Promise<Metadata> {
  const p = await params;
  const id = p.id?.[0] || "";
  const notice = id ? await getNotice(id) : null;

  const title = notice ? `故 ${notice.deceased_name}님 부고` : "부고장";
  const description = notice
    ? `${notice.funeral_home}${notice.room ? ` · ${notice.room}` : ""}`
    : "부고장 정보를 찾을 수 없거나 만료되었습니다.";

  const url = id ? `${SITE_URL}/m/${id}` : `${SITE_URL}/m`;
  const image = `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true },
    openGraph: { title, description, url, type: "website", images: [{ url: image }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function NoticePage({
  params,
}: {
  params: Promise<{ id?: string[] }>;
}) {
  const p = await params;
  const id = p.id?.[0] || "";
  const data = id ? await getNotice(id) : null;

  if (!data) {
    return (
      <div style={{ maxWidth: 760, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 26 }}>부고장을 찾을 수 없습니다</h1>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          링크가 잘못되었거나, 이미 만료/삭제된 부고장입니다.
        </p>
      </div>
    );
  }

  const shareUrl = `${SITE_URL}/m/${data.id}`;
  const created = new Date(data.created_at);
  const expires = new Date(data.expires_at);

  const all = data.bereaved_list ? [...data.bereaved_list] : [];

  // 자부/사위 attachTo 묶기
  const attached = all.filter((x) => (x.role === "자부" || x.role === "사위") && x.attachTo);
  const attachedMap = new Map<string, BereavedItem[]>();
  for (const x of attached) {
    const key = String(x.attachTo);
    if (!attachedMap.has(key)) attachedMap.set(key, []);
    attachedMap.get(key)!.push(x);
  }
  for (const [k, arr] of attachedMap.entries()) {
    arr.sort((a, b) => seqNum(a.seq) - seqNum(b.seq));
    attachedMap.set(k, arr);
  }

  const general = all.filter((x) => !((x.role === "자부" || x.role === "사위") && x.attachTo));
  const generalSorted = sortGeneral(general);

  const children = generalSorted.filter((x) => x.role === "아들" || x.role === "딸");
  const others = generalSorted.filter((x) => x.role !== "아들" && x.role !== "딸");

  // 카드 크기 통일
  const cardStyle: any = {
    padding: 14,
    border: "1px solid #f0f0f0",
    borderRadius: 16,
    background: "#fff",
    minHeight: 92,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 10,
  };

  // ✅ 폰트/간격/자간을 “살짝” 줄임
  const nameStyle: any = { fontWeight: 900, fontSize: 15, letterSpacing: "-0.02em" };
  const metaStyle: any = { color: "#6b7280", fontSize: 12, letterSpacing: "-0.02em" };
  const phoneStyle: any = { color: "#374151", fontSize: 12, letterSpacing: "-0.02em" };

  const sepDot = <span style={metaStyle}>·</span>;
  const sepBar = <span style={{ ...metaStyle, color: "#d1d5db" }}>|</span>;

  const PersonInline = (p: BereavedItem) => (
    <>
      <span style={nameStyle}>{p.name}</span>
      <span style={metaStyle}>{p.role}</span>
      {p.phone ? (
        <>
          {sepDot}
          <span style={phoneStyle}>{p.phone}</span>
        </>
      ) : null}
    </>
  );

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>故 {data.deceased_name}님 부고</h1>

      {data.deceased_age !== null ? (
        <div style={{ marginTop: 6, color: "#374151" }}>
          <b>고인 나이</b> : {data.deceased_age}세
        </div>
      ) : null}

      <div style={{ padding: 14, border: "1px solid #ddd", borderRadius: 16, marginTop: 16, background: "#fff" }}>
        <p style={{ margin: 0, fontSize: 16 }}>
          <b>장례식장</b> : {data.funeral_home}
        </p>
        {data.room ? (
          <p style={{ margin: "8px 0 0 0", fontSize: 16 }}>
            <b>빈소</b> : {data.room}
          </p>
        ) : null}
        {data.map_url ? (
          <p style={{ margin: "8px 0 0 0", fontSize: 16 }}>
            <b>지도</b> :{" "}
            <a href={data.map_url} target="_blank" rel="noreferrer">
              위치 보기
            </a>
          </p>
        ) : null}
      </div>

      {(children.length || others.length) ? (
        <div style={{ marginTop: 14, padding: 14, background: "#fff", border: "1px solid #eee", borderRadius: 16 }}>
          <b style={{ fontSize: 22 }}>상주</b>

          {children.length ? (
            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              {children.map((c, i) => {
                const key = c.gid || "";
                const inlaws = key ? attachedMap.get(key) || [] : [];
                const hasAccounts =
                  (c.accounts && c.accounts.length) || inlaws.some((x) => x.accounts && x.accounts.length);

                return (
                  <div key={i} style={cardStyle}>
                    {/* ✅ 여기 한 줄은 자동 축소로 “넘치면 줄 전체가 살짝 작아져서” 한 줄에 모두 표시 */}
                    <FitLine minScale={0.78}>
                      {PersonInline(c)}
                      {inlaws.length ? <span style={{ margin: "0 6px" }}>{sepBar}</span> : null}
                      {inlaws.map((x, j) => (
                        <span key={j} style={{ marginLeft: j === 0 ? 0 : 8 }}>
                          {PersonInline(x)}
                        </span>
                      ))}
                    </FitLine>

                    {hasAccounts ? (
                      <div>
                        {c.accounts && c.accounts.length ? <AccountsToggle accounts={c.accounts} title="계좌" /> : null}
                        {inlaws.map((x, j) =>
                          x.accounts && x.accounts.length ? (
                            <div key={j} style={{ marginTop: 8 }}>
                              <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 12, color: "#374151" }}>
                                {x.name}({x.role})
                              </div>
                              <AccountsToggle accounts={x.accounts} title="계좌" />
                            </div>
                          ) : null
                        )}
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {others.length ? (
            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              {others.map((b, i) => (
                <div key={i} style={cardStyle}>
                  <FitLine minScale={0.78}>{PersonInline(b)}</FitLine>
                  {b.accounts && b.accounts.length ? <AccountsToggle accounts={b.accounts} title="계좌" /> : <div />}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {data.message ? (
        <div style={{ marginTop: 14, padding: 14, background: "#fff", border: "1px solid #eee", borderRadius: 16 }}>
          <b>추가 안내</b>
          <div style={{ marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#111827" }}>
            {data.message}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 18, color: "#666", fontSize: 13, lineHeight: 1.6 }}>
        <div>생성: {created.toLocaleString()}</div>
        <div>만료: {expires.toLocaleString()} (만료 후 자동 비공개)</div>
      </div>

      <div style={{ marginTop: 22, padding: 14, border: "1px solid #eee", borderRadius: 16, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <b>공유 링크</b>
          <CopyLinkButton text={shareUrl} />
        </div>
        <div style={{ marginTop: 8, wordBreak: "break-all" }}>{shareUrl}</div>
      </div>

      <div style={{ marginTop: 14 }}>
        <DeleteBoxClient id={data.id} />
      </div>
    </div>
  );
}
