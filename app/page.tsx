import Link from "next/link";

export default function Home() {
  return (
    <div style={{ maxWidth: 720, margin: "60px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 34, marginBottom: 10 }}>부고장 링크 생성</h1>
      <p style={{ color: "#555", lineHeight: 1.7 }}>
        부고장을 작성하면 공유 링크가 생성됩니다. 카카오톡에 링크를 붙여 보내면 썸네일과 요약 텍스트가 표시됩니다.
      </p>

      <Link
        href="/create"
        style={{
          display: "inline-block",
          marginTop: 18,
          padding: "12px 16px",
          border: "1px solid #ddd",
          borderRadius: 10,
          textDecoration: "none",
        }}
      >
        부고장 작성하러 가기 →
      </Link>

      <p style={{ marginTop: 18, color: "#777", fontSize: 13 }}>
        검색엔진 노출은 차단되어 있으며, 생성된 부고는 일정 기간 후 자동 만료됩니다.
      </p>
    </div>
  );
}
