import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type NoticeRow = {
  id: string;
  deceased_name: string;
  deceased_age: number | null;
  funeral_home: string;
  room: string | null;
  created_at: string;
  expires_at: string;
};

export default async function NoticesPage() {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseServer
    .from("notices")
    .select("id,deceased_name,deceased_age,funeral_home,room,created_at,expires_at")
    .gt("expires_at", nowIso) // 현재 열어볼 수 있는(만료 안 된) 항목만
    .order("created_at", { ascending: false });

  const notices = (data || []) as NoticeRow[];

  return (
    <div style={{ maxWidth: 860, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 30, margin: 0 }}>부고장 목록</h1>
          <p style={{ color: "#555", marginTop: 8, lineHeight: 1.6 }}>
            현재 열어볼 수 있는 부고장만 표시됩니다.
          </p>
        </div>

        <Link
          href="/create"
          style={{
            display: "inline-block",
            padding: "12px 16px",
            border: "1px solid #111827",
            borderRadius: 12,
            textDecoration: "none",
            background: "#111827",
            color: "#fff",
            fontWeight: 800,
          }}
        >
          새 부고장 만들기
        </Link>
      </div>

      <div style={{ marginTop: 16, color: "#666", fontSize: 14 }}>
        총 {notices.length}건
      </div>

      {error ? (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            border: "1px solid #f3d4d4",
            background: "#fff7f7",
            borderRadius: 16,
            color: "#a33",
          }}
        >
          목록을 불러오지 못했습니다: {error.message}
        </div>
      ) : notices.length === 0 ? (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            border: "1px solid #eee",
            background: "#fff",
            borderRadius: 16,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6 }}>표시할 부고장이 없습니다.</div>
          <div style={{ color: "#666", lineHeight: 1.6 }}>
            아직 생성된 부고가 없거나, 기존 부고가 모두 삭제/만료된 상태입니다.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {notices.map((n) => {
            const created = new Date(n.created_at);
            const expires = new Date(n.expires_at);

            return (
              <Link
                key={n.id}
                href={`/m/${n.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    border: "1px solid #eee",
                    background: "#fff",
                    borderRadius: 16,
                    padding: 16,
                    transition: "transform 0.12s ease, box-shadow 0.12s ease",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.3 }}>
                        故 {n.deceased_name}님 부고
                      </div>

                      {n.deceased_age !== null ? (
                        <div style={{ marginTop: 6, color: "#374151", fontSize: 14 }}>
                          고인 나이: {n.deceased_age}세
                        </div>
                      ) : null}

                      <div style={{ marginTop: 10, color: "#111827", lineHeight: 1.7 }}>
                        <div>
                          <b>장례식장</b> : {n.funeral_home}
                        </div>
                        {n.room ? (
                          <div>
                            <b>빈소</b> : {n.room}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div style={{ color: "#6b7280", fontSize: 13, whiteSpace: "nowrap" }}>
                      열기 →
                    </div>
                  </div>

                  <div style={{ marginTop: 12, color: "#666", fontSize: 13, lineHeight: 1.6 }}>
                    <div>생성: {created.toLocaleString()}</div>
                    <div>만료: {expires.toLocaleString()}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
