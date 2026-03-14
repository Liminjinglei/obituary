"use client";

import { useState } from "react";
import styles from "./DeleteBoxClient.module.css";

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

      if (msg) {
        try {
          const json = JSON.parse(msg);
          msg = json?.error ? String(json.error) : JSON.stringify(json);
        } catch {}
      }

      if (!res.ok) {
        const fallback = msg || `(empty body) HTTP ${res.status} ${res.statusText}`;
        alert(`삭제 실패: ${fallback}`);
        return;
      }

      alert("삭제되었습니다.");
      window.location.href = "/";
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      alert("삭제 실패(네트워크): " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.box}>
      <b>삭제</b>
      <p className={styles.help}>생성 시 받은 삭제키를 입력하면 삭제할 수 있습니다.</p>
      <input
        value={deleteKey}
        onChange={(e) => setDeleteKey(e.target.value)}
        placeholder="삭제키 입력"
        className={styles.input}
      />
      <button type="button" onClick={onDelete} disabled={loading} className={styles.button}>
        {loading ? "삭제 중..." : "삭제하기"}
      </button>
    </div>
  );
}
