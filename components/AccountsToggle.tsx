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

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 900 }}>{title}</div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: open ? "#111827" : "#fff",
            color: open ? "#fff" : "#111827",
            fontWeight: 900,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {open ? "계좌닫기" : "계좌보기"}
        </button>
      </div>

      {open ? (
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
      ) : (
        <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>
          (숨김 상태) 버튼을 눌러 계좌를 확인하세요.
        </div>
      )}
    </div>
  );
}
