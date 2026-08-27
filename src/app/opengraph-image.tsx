import { ImageResponse } from "next/og";

export const alt = "СТРОЙДОМ — строительство загородных домов под ключ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #1f3b2c 0%, #16281e 100%)",
          color: "#f5f1e8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 8, color: "#c9a227" }}>
          СТРОЙДОМ
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 68, lineHeight: 1.15, maxWidth: 900 }}>
            Строительство загородных домов под ключ
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#c8d1c9", maxWidth: 860 }}>
            Подбор параметров дома, заявка, уведомления и учёт обращений
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#8fa094" }}>
          Демонстрационный проект для портфолио
        </div>
      </div>
    ),
    size,
  );
}
