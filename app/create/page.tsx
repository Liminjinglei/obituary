"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type AccountRow = { bank: string; number: string; holder: string };
type BereavedRow = {
  role: string; // 버튼에서 고르는 신분
  name: string;
  phone: string;
  accounts: AccountRow[];
};

const ROLE_OPTIONS: string[] = [
  "배우자", "아들", "딸", "자부",
  "사위", "손자", "손녀", "외손자",
  "외손녀", "손부", "손서", "외손부",
  "외손서", "형(兄)", "오빠", "누나",
  "언니", "남동생", "여동생", "부(父)",
  "모(母)", "고모", "이모", "백부",
  "백모", "숙부", "숙모", "형수",
  "제수", "매형", "매제", "기타",
];

function RolePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
      {ROLE_OPTIONS.map((r) => {
        const active = value === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            style={{
              padding: "14px 10px",
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              background: active ? "#111827" : "#fff",
              color: active ? "#fff" : "#111827",
              fontWeight: 800,
            }}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();

  const [deceasedName, setDeceasedName] = useState("");
  const [deceasedAge, setDeceasedAge] = useState("");
  const [funeralHome, setFuneralHome] = useState("");
  const [room, setRoom] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [message, setMessage] = useState("");

  const [bereavedRows, setBereavedRows] = useState<BereavedRow[]>([
    { role: "아들", name: "", phone: "", accounts: [] },
  ]);

  const [loading, setLoading] = useState(false);

  // 전송용 변환: 이름 없는 줄은 제외, 계좌는 bank+number 있는 것만
  const bereavedList = useMemo(() => {
    return bereavedRows
      .map((r, idx) => ({
        seq: idx, // 같은 신분끼리 입력 순 유지용
        role: r.role,
        name: r.name.trim(),
        phone: r.phone.trim() || undefined,
        accounts: r.accounts
          .map((a) => ({
            bank: a.bank.trim(),
            number: a.number.trim(),
            holder: a.holder.trim(),
          }))
          .filter((a) => a.bank && a.number)
          .map((a) => ({ bank: a.bank, number: a.number, holder: a.holder || undefined })),
      }))
      .filter((r) => r.name.length > 0);
  }, [bereavedRows]);

  const addBereaved = () => {
    setBereavedRows((prev) => [...prev, { role: "아들", name: "", phone: "", accounts: [] }]);
  };

  const removeBereaved = (idx: number) => {
    setBereavedRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateBereaved = (idx: number, patch: Partial<BereavedRow>) => {
    setBereavedRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addAccount = (bIdx: number) => {
    setBereavedRows((prev) =>
      prev.map((r, i) =>
        i === bIdx ? { ...r, accounts: [...r.accounts, { bank: "", number: "", holder: "" }] } : r
      )
    );
  };

  const removeAccount = (bIdx: number, aIdx: number) => {
    setBereavedRows((prev) =>
      prev.map((r, i) =>
        i === bIdx ? { ...r, accounts: r.accounts.filter((_, j) => j !== aIdx) } : r
      )
    );
  };

  const updateAccount = (bIdx: number, aIdx: number, key: keyof AccountRow, value: string) => {
    setBereavedRows((prev) =>
      prev.map((r, i) => {
        if (i !== bIdx) return r;
        const accounts = r.accounts.map((a, j) => (j === aIdx ? { ...a, [key]: value } : a));
        return { ...r, accounts };
      })
    );
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
          bereavedList,
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
          <div style={{ fontWeight: 900, marginBottom: 10 }}>기본 정보</div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label>고인 성함 *</label>
              <input value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
            </div>

            <div>
              <label>고인 나이(선택)</label>
              <input value={deceasedAge} onChange={(e) => setDeceasedAge(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} placeholder="예) 78" inputMode="numeric" />
            </div>

            <div>
              <label>장례식장 *</label>
              <input value={funeralHome} onChange={(e) => setFuneralHome(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} />
            </div>

            <div>
              <label>빈소(호실)</label>
              <input value={room} onChange={(e) => setRoom(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} placeholder="예) 3호실" />
            </div>

            <div>
              <label>지도 링크(선택)</label>
              <input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6 }} placeholder="예) 네이버지도/카카오맵 공유 URL" />
            </div>

            <div>
              <label>추가 안내(선택)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} style={{ width: "100%", padding: 10, marginTop: 6, minHeight: 110 }} placeholder="예) 주차 지원 3시간 가능합니다." />
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontWeight: 900 }}>상주 정보</div>
            <button type="button" onClick={addBereaved}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#111827", color: "#fff", fontWeight: 800 }}>
              + 상주 추가
            </button>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {bereavedRows.map((r, idx) => (
              <div key={idx} style={{ border: "1px solid #eee", borderRadius: 14, padding: 12, background: "#fafafa" }}>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>신분 선택</div>
                <RolePicker value={r.role} onChange={(v) => updateBereaved(idx, { role: v })} />

                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  <div>
                    <label>이름</label>
                    <input value={r.name} onChange={(e) => updateBereaved(idx, { name: e.target.value })}
                      style={{ width: "100%", padding: 10, marginTop: 6 }} />
                  </div>

                  <div>
                    <label>연락처(선택)</label>
                    <input value={r.phone} onChange={(e) => updateBereaved(idx, { phone: e.target.value })}
                      style={{ width: "100%", padding: 10, marginTop: 6 }} placeholder="예) 010-1234-5678" />
                  </div>

                  <div style={{ marginTop: 6, paddingTop: 10, borderTop: "1px dashed #ddd" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 900 }}>계좌 정보(선택)</div>
                      <button type="button" onClick={() => addAccount(idx)}
                        style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 800 }}>
                        + 계좌 추가
                      </button>
                    </div>

                    {r.accounts.length === 0 ? (
                      <div style={{ marginTop: 8, color: "#777", fontSize: 13 }}>
                        등록된 계좌가 없습니다.
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                        {r.accounts.map((a, aIdx) => (
                          <div key={aIdx} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, background: "#fff" }}>
                            <div style={{ display: "grid", gap: 10 }}>
                              <div>
                                <label>은행 *</label>
                                <input value={a.bank} onChange={(e) => updateAccount(idx, aIdx, "bank", e.target.value)}
                                  style={{ width: "100%", padding: 10, marginTop: 6 }} placeholder="예) 국민은행" />
                              </div>
                              <div>
                                <label>계좌번호 *</label>
                                <input value={a.number} onChange={(e) => updateAccount(idx, aIdx, "number", e.target.value)}
                                  style={{ width: "100%", padding: 10, marginTop: 6 }} placeholder="예) 123-45-678901" />
                              </div>
                              <div>
                                <label>예금주(선택)</label>
                                <input value={a.holder} onChange={(e) => updateAccount(idx, aIdx, "holder", e.target.value)}
                                  style={{ width: "100%", padding: 10, marginTop: 6 }} placeholder="예) 홍길동" />
                              </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                              <button type="button" onClick={() => removeAccount(idx, aIdx)}
                                style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 800 }}>
                                계좌 삭제
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p style={{ marginTop: 8, color: "#777", fontSize: 12, lineHeight: 1.5 }}>
                      • 은행+계좌번호가 비어있는 계좌는 저장되지 않습니다.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => removeBereaved(idx)}
                    disabled={bereavedRows.length <= 1}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      background: bereavedRows.length <= 1 ? "#eee" : "#fff",
                      cursor: bereavedRows.length <= 1 ? "not-allowed" : "pointer",
                      fontWeight: 800,
                    }}
                  >
                    상주 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 10, color: "#777", fontSize: 13, lineHeight: 1.5 }}>
            • 이름이 비어있는 상주는 저장되지 않습니다.<br />
            • 표시할 때는 입력 순서와 무관하게 신분(항렬) 기준으로 자동 정렬됩니다.
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
            fontWeight: 900,
          }}
        >
          {loading ? "생성 중..." : "저장하고 공유 링크 만들기"}
        </button>
      </div>
    </div>
  );
}
