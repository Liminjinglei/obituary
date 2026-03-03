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

async function getNotice(id: string): Promise<Notice | null> {
  const { data } = await supabaseServer
    .from("notices")
    .select("id,deceased_name,funeral_home,room,summary,map_url,message,expires_at,created_at")
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
      <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 26 }}>부고장을 찾을 수 없습니다</h1>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          링크가 잘못되었거나, 이미 만료/삭제된 부고장입니다.
        </p>
      </div>
    );
  }

  const created = new Date(data.created_at);
  const expires = new Date(data.expires_at);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>故 {data.deceased_name}님 부고</h1>

      <div style={{ padding: 14, border: "1px solid #ddd", borderRadius: 12, marginTop: 16 }}>
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
        <div style={{ marginTop: 18, padding: 14, background: "#fafafa", borderRadius: 12 }}>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{data.message}</p>
        </div>
      ) : null}

      <div style={{ marginTop: 18, color: "#666", fontSize: 13, lineHeight: 1.6 }}>
        <div>생성: {created.toLocaleString()}</div>
        <div>만료: {expires.toLocaleString()} (만료 후 자동 비공개)</div>
      </div>

      <div style={{ marginTop: 22 }}>
        <ShareBox id={data.id} />
      </div>

      <div style={{ marginTop: 14 }}>
        <DeleteBox id={data.id} />
      </div>
    </div>
  );
}

function ShareBox({ id }: { id: string }) {
  const url = `${SITE_URL}/m/${id}`;

  return (
    <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
      <b>공유 링크</b>
      <div style={{ marginTop: 8, wordBreak: "break-all" }}>{url}</div>
      <p style={{ marginTop: 10, color: "#777", fontSize: 13, lineHeight: 1.5 }}>
        위 링크를 카톡에 붙여 보내면 미리보기가 자동 생성됩니다.
      </p>
    </div>
  );
}

function DeleteBox({ id }: { id: string }) {
  return (
    <form
      action={async (formData) => {
        "use server";
        const deleteKey = String(formData.get("deleteKey") || "").trim();
        if (!deleteKey) return;

        await fetch(`${SITE_URL}/api/notices/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleteKey }),
        });
      }}
      style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}
    >
      <b>삭제</b>
      <p style={{ marginTop: 8, color: "#777", fontSize: 13, lineHeight: 1.5 }}>
        생성 시 받은 삭제키를 입력하면 삭제할 수 있습니다.
      </p>
      <input
        name="deleteKey"
        placeholder="삭제키 입력"
        style={{ width: "100%", padding: 10, marginTop: 6 }}
      />
      <button type="submit" style={{ width: "100%", padding: 12, marginTop: 10 }}>
        삭제하기
      </button>
    </form>
  );
}
