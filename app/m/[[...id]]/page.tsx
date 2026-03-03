import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabaseServer";
import { SITE_URL } from "@/lib/config";
import DeleteBoxClient from "@/components/DeleteBoxClient";

type BereavedItem = { name: string; relation?: string; phone?: string };

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

async function getNotice(id: string): Promise<Notice | null> {
  const { data } = await supabaseServer
    .from("notices")
    .select("id,deceased_name,deceased_age,funeral_home,room,summary,map_url,message,bereaved_list,expires_at,created_at")
    .eq("id", id)
    .single();

  if (!data) return null;

  const exp = new Date(data.expires_at).getTime();
  if (Number.isNaN(exp)) return null;
  if (exp <= Date.now()) return null;

  return data as Notice;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id?: string[] }> }
): Promise<Metadata> {
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

export default async function NoticePage(
  { params }: { params: Promise<{ id?: string[] }> }
) {
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

  const created = new Date(data.created_at);
  const expires = new Date(data.expires_at);
  const shareUrl = `${SITE_URL}/m/${data.id}`;

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>故 {data.deceased_name}님 부고</h1>

      {data.deceased_age !== null ? (
        <div style={{ marginTop: 6, color: "#374151" }}>
          <b>고인 나이</b> : {data.deceased_age}세
        </div>
      ) : null}

      <div style={{ padding: 14, border: "1px solid #ddd", borderRadius: 12, marginTop: 16, background: "#fff" }}>
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

      {data.bereaved_list && data.bereaved_list.length ? (
        <div style={{ marginTop: 14, padding: 14, background: "#fff", border: "1px solid #eee", borderRadius: 12 }}>
          <b>상주</b>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {data.bereaved_list.map((b, i) => (
              <div key={i} style={{ padding: 10, border: "1px solid #f0f0f0", borderRadius: 12 }}>
                <div style={{ fontWeight: 700 }}>{b.name}</div>
                {(b.relation || b.phone) ? (
                  <div style={{ marginTop: 4, color: "#555", fontSize: 14, lineHeight: 1.6 }}>
                    {b.relation ? <span>{b.relation}</span> : null}
                    {b.relation && b.phone ? <span> · </span> : null}
                    {b.phone ? <span>{b.phone}</span> : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {data.message ? (
        <div style={{ marginTop: 14, padding: 14, background: "#fff", border: "1px solid #eee", borderRadius: 12 }}>
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

      <div style={{ marginTop: 22, padding: 14, border: "1px solid #eee", borderRadius: 12, background: "#fff" }}>
        <b>공유 링크</b>
        <div style={{ marginTop: 8, wordBreak: "break-all" }}>{shareUrl}</div>
      </div>

      <div style={{ marginTop: 14 }}>
        <DeleteBoxClient id={data.id} />
      </div>
    </div>
  );
}
