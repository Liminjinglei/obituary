"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreatePage() {
  const router = useRouter();

  const [deceasedName, setDeceasedName] = useState("");
  const [funeralHome, setFuneralHome] = useState("");
  const [room, setRoom] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

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
          funeralHome: funeralHome.trim(),
          room: room.trim(),
          mapUrl: mapUrl.trim(),
          message: message.trim(),
        }),
      });

      const json = await res.json();
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
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>부고장 작성</h1>
      <p style={{ color: "#555", marginBottom: 20 }}>
        저장하면 공유 링크가 생성됩니다. 카카오톡에 링크를 붙여 보내면 미리보기가 표시됩니다.
      </p>

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
            placeholder="예) 삼가 고인의 명복을 빕니다..."
          />
        </div>

        <button
          onClick={onCreate}
          disabled={loading}
          style={{ width: "100%", padding: 14, fontSize: 16, cursor: loading ? "not-allowed" : "pointer" }}
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
