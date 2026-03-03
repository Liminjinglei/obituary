"use client";

import { useState } from "react";

export default function DeleteBoxClient({ id }: { id: string }) {
  const [deleteKey, setDeleteKey] = useState("");
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!deleteKey.trim()) {
      alert("삭제키를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/notices/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteKey: deleteKey.trim() }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "삭제 실패");
        return;
      }

      alert("삭제되었습니다.");
      // 삭제 후 홈으로 이동(원하면 /create로 이동해도 됨)
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
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
