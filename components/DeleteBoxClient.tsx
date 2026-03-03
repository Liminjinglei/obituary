"use client";

import { useState } from "react";

export default function DeleteBoxClient({ id }: { id: string }) {
  const [deleteKey, setDeleteKey] = useState("");
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    const key = deleteKey.trim();
    if (!key) {
      alert("삭제키를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const url = `/api/notices/${encodeURIComponent(id)}?deleteKey=${encodeURIComponent(key)}`;
      const res = await fetch(url, { method: "DELETE" });

      const text = await res.text();
      let msg = text?.trim() || "";

      // JSON이면 error를 뽑기
      if (msg) {
        try {
          const json = JSON.parse(msg);
          msg = json?.error ? String(json.error) : JSON.stringify(json);
        } catch {}
      }

      if (!res.ok) {
        // 본문이 비면 상태코드라도 보여줌
        const fallback = msg || `(empty body) HTTP ${res.status} ${res.statusText}`;
        alert(`삭제 실패: ${fallback}`);
        return;
      }

      alert("삭제되었습니다.");
      window.location.href = "/";
    } catch (e: any) {
      alert("삭제 실패(네트워크): " + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12, background: "#fff" }}>
      <b>삭제</b>
      <p style={{ marginTop: 8, color: "#777", fontSize: 13, lineHeight: 1.5 }}>
        생성 시 받은 삭제키를 입력하면 삭제할 수 있습니다.
      </p>
      <input
        value={deleteKey}
        onChange={(e) => setDeleteKey(e.target.value)}
        placeholder="삭제키 입력"
        style={{ width: "100%", padding: 10, marginTop: 6 }}
      />
      <button
        type="button"
        onClick={onDelete}
        disabled={loading}
        style={{ width: "100%", padding: 12, marginTop: 10, cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "삭제 중..." : "삭제하기"}
      </button>
    </div>
  );
}
