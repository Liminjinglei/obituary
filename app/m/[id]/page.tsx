import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const title = "부고장";
  const description = "부고장 정보를 확인하세요.";
  const url = `${SITE_URL}/m/${params.id}`;
  const image = `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: image }],
    },
  };
}

export default function NoticePage({ params }: { params: { id: string } }) {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28 }}>부고장 (샘플 화면)</h1>
      <p style={{ color: "#555" }}>id: {params.id}</p>
      <p style={{ color: "#777" }}>
        다음 단계에서 Supabase DB를 연결해서 실제 데이터를 보여주도록 만들 거예요.
      </p>
    </div>
  );
}
