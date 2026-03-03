"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type BereavedRow = { name: string; relation: string; phone: string };

export default function CreatePage() {
  const router = useRouter();

  const [deceasedName, setDeceasedName] = useState("");
  const [deceasedAge, setDeceasedAge] = useState("");
  const [funeralHome, setFuneralHome] = useState("");
  const [room, setRoom] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [message, setMessage] = useState("");

  const [bereavedRows, setBereavedRows] = useState<BereavedRow[]>([
    { name: "", relation: "", phone: "" },
  ]);

  const [loading, setLoading] = useState(false);

  const bereavedList = useMemo(() => {
    // 이름이 있는 줄만 전송
    return bereavedRows
      .map((r) => ({
        name: r.name.trim(),
        relation: r.relation.trim(),
        phone: r.phone.trim(),
      }))
      .filter((r) => r.name.length > 0);
  }, [bereavedRows]);

  const addRow = () => {
    setBereavedRows((prev) => [...prev, { name: "", relation: "", phone: "" }]);
  };

  const removeRow = (idx: number) => {
    setBereavedRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, key: keyof BereavedRow, value: string) => {
    setBereavedRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  };

  const onCreate = async () => {
    if (!deceasedName.trim() || !funeralHome.trim()) {
      alert("고인 성함과 장례식장은 필수입니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deceasedName: deceasedName.trim(),
          deceasedAge: deceasedAge.trim(),
          funeralHome: funeralHome.trim(),
          room: room.trim(),
          mapUrl: mapUrl.trim(),
          message: message.trim(),
          bereavedList, // 배열 전송
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || "생성 실패");
        return;
      }

      alert(
        `부고장이 생성되었습니다.\n\n[삭제키]\n${json.deleteKey}\n\n삭제가 필요하면 이 키가 필요합니다. 꼭 저장해두세요.`
      );

      router.push(`/m/${json.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>부고장 작성</h1>
      <p style={{ color: "#555", marginBottom: 18 }}>
        저장하면 공유 링크가 생성됩니다. 카카오톡에 링크를 붙여 보내면 미리보기가 표시됩니다.
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>기본 정보</div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label>고인 성함 *</label>
              <input
                value={deceasedName}
                onChange={(e) => setDeceasedName(e.target.value)}
                style={{ width: "100%", padding: 10, marginTop: 6 }}
                placeholder="예) 홍길동"
              />
            </div>

            <div>
              <label>고인 나이(선택)</label>
              <input
                value={deceasedAge}
                onChange={(e) => setDeceasedAge(e.target.value)}
                style={{ width: "100%", padding: 10, marginTop: 6 }}
                placeholder="예) 78"
                inputMode="numeric"
              />
            </div>

            <div>
              <label>장례식장 *</label>
              <input
                value={funeralHome}
                onChange={(e) => setFuneralHome(e.target.value)}
                style={{ width: "100%", padding: 10, marginTop: 6 }}
                placeholder="예) ○○장례식장"
              />
            </div>

            <div>
              <label>빈소(호실)</label>
              <input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                style={{ width: "100%", padding: 10, marginTop: 6 }}
                placeholder="예) 3호실"
              />
            </div>

            <div>
              <label>지도 링크(선택)</label>
              <input
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                style={{ width: "100%", padding: 10, marginTop: 6 }}
                placeholder="예) 네이버지도/카카오맵 공유 URL"
              />
            </div>

            <div>
              <label>안내 문구(선택)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ width: "100%", padding: 10, marginTop: 6, minHeight: 110 }}
                placeholder="예) 주차 지원 3시간 가능합니다."
              />
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontWeight: 800 }}>상주 정보(여러 명 추가 가능)</div>
            <button
              type="button"
              onClick={addRow}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#111827", color: "#fff" }}
            >
              + 상주 추가
            </button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {bereavedRows.map((r, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 14,
                  padding: 12,
                  background: "#fafafa",
                }}
              >
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <label>이름</label>
                    <input
                      value={r.name}
                      onChange={(e) => updateRow(idx, "name", e.target.value)}
                      style={{ width: "100%", padding: 10, marginTop: 6 }}
                      placeholder="예) 김누구"
                    />
                  </div>

                  <div>
                    <label>관계(선택)</label>
                    <input
                      value={r.relation}
                      onChange={(e) => updateRow(idx, "relation", e.target.value)}
                      style={{ width: "100%", padding: 10, marginTop: 6 }}
                      placeholder="예) 아들 / 딸 / 배우자"
                    />
                  </div>

                  <div>
                    <label>연락처(선택)</label>
                    <input
                      value={r.phone}
                      onChange={(e) => updateRow(idx, "phone", e.target.value)}
                      style={{ width: "100%", padding: 10, marginTop: 6 }}
                      placeholder="예) 010-1234-5678"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    disabled={bereavedRows.length <= 1}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      background: bereavedRows.length <= 1 ? "#eee" : "#fff",
                      cursor: bereavedRows.length <= 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 10, color: "#777", fontSize: 13, lineHeight: 1.5 }}>
            • 이름이 비어있는 줄은 저장되지 않습니다.<br />
            • 최대 10명까지만 저장됩니다.
          </p>
        </div>

        <button
          onClick={onCreate}
          disabled={loading}
          style={{
            width: "100%",
            padding: 16,
            fontSize: 16,
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            background: "#111827",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "생성 중..." : "저장하고 공유 링크 만들기"}
        </button>

        <p style={{ color: "#777", fontSize: 13, lineHeight: 1.5 }}>
          • 부고는 만료기간이 지나면 자동 비공개됩니다.<br />
          • 삭제가 필요하면 생성 시 제공되는 삭제키가 필요합니다.
        </p>
      </div>
    </div>
  );
}
