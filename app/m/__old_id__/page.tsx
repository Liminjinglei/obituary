import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabaseServer";
import { SITE_URL } from "@/lib/config";

type Notice = {
  id: string;
  deceased_name: string;
  funeral_home: string;
  room: string | null;
  summary: string | null;
  map_url: string | null;
  message: string | null;
  expires_at: string;
  created_at: string;
};

async function getNotice(id: string): Promise<{ notice: Notice | null; reason?: string }> {
  const { data, error } = await supabaseServer
    .from("notices")
    .select("id,deceased_name,funeral_home,room,summary,map_url,message,expires_at,created_at")
    .eq("id", id)
    .single();

  if (error) return { notice: null, reason: "db_error: " + error.message };
  if (!data) return { notice: null, reason: "no_data" };

  const exp = new Date(data.expires_at).getTime();
  if (Number.isNaN(exp)) return { notice: null, reason: "invalid_expires_at: " + String(data.expires_at) };
  if (exp <= Date.now()) return { notice: null, reason: "expired" };

  return { notice: data as Notice };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { notice } = await getNotice(params.id);

  const title = notice ? `故 ${notice.deceased_name}님 부고` : "부고장";
  const description = notice
    ? `${notice.funeral_home}${notice.room ? ` · ${notice.room}` : ""}`
    : "부고장 정보를 찾을 수 없거나 만료되었습니다.";

  const url = `${SITE_URL}/m/${params.id}`;
  const image = `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true },
    openGraph: { title, description, url, type: "website", images: [{ url: image }] },
  };
}

export default async function NoticePage({ params }: { params: { id: string } }) {
  const result = await getNotice(params.id);

  if (!result.notice) {
    return (
      <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 26 }}>부고장을 찾을 수 없습니다</h1>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          링크가 잘못되었거나, 이미 만료/삭제된 부고장입니다.
        </p>

        <div style={{ marginTop: 16, padding: 12, border: "1px dashed #bbb", borderRadius: 10, fontSize: 13 }}>
          <div><b>DEBUG</b></div>
          <div>params.id: {params.id}</div>
          <div>reason: {result.reason || "unknown"}</div>
          <div>SITE_URL: {SITE_URL}</div>
          <div>now: {new Date().toISOString()}</div>
        </div>
      </div>
    );
  }

  const data = result.notice;
  const created = new Date(data.created_at);
  const expires = new Date(data.expires_at);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <div style={{ marginBottom: 12, padding: 12, border: "1px dashed #bbb", borderRadius: 10, fontSize: 13 }}>
        <div><b>DEBUG</b></div>
        <div>params.id: {params.id}</div>
        <div>db.id: {data.id}</div>
        <div>expires_at(raw): {data.expires_at}</div>
        <div>now: {new Date().toISOString()}</div>
      </div>

      <h1 style={{ fontSize: 30, marginBottom: 8 }}>故 {data.deceased_name}님 부고</h1>

      <div style={{ padding: 14, border: "1px solid #ddd", borderRadius: 10, marginTop: 16 }}>
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

      {data.message ? (
        <div style={{ marginTop: 18, padding: 14, background: "#fafafa", borderRadius: 10 }}>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{data.message}</p>
        </div>
      ) : null}

      <div style={{ marginTop: 18, color: "#666", fontSize: 13, lineHeight: 1.6 }}>
        <div>생성: {created.toLocaleString()}</div>
        <div>만료: {expires.toLocaleString()} (만료 후 자동 비공개)</div>
      </div>
    </div>
  );
}
