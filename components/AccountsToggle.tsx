"use client";

import { useState } from "react";

type AccountItem = { bank: string; number: string; holder?: string };

export default function AccountsToggle({
  accounts,
  title = "계좌",
}: {
  accounts: AccountItem[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!accounts || accounts.length === 0) return null;

  // ✅ 닫힘 상태에서는 "작은 버튼 한 줄"만 보이게
  if (!open) {
    return (
      <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            background: "#fff",
            color: "#111827",
            fontWeight: 900,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {title} 보기
        </button>
      </div>
    );
  }

  // ✅ 열린 상태에서만 박스/리스트가 크게 보이게
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 900 }}>{title}</div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            background: "#111827",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          닫기
        </button>
      </div>

      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {accounts.map((a, j) => (
          <div
            key={j}
            style={{
              background: "#fafafa",
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 10,
            }}
          >
            <div style={{ fontWeight: 800 }}>{a.bank}</div>
            <div style={{ marginTop: 4, color: "#111827" }}>{a.number}</div>
            {a.holder ? (
              <div style={{ marginTop: 2, color: "#555", fontSize: 13 }}>
                예금주: {a.holder}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
