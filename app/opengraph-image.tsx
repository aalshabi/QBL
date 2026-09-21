import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * صورة المشاركة الافتراضية لكل الصفحات العامة.
 *
 * لم تكن الصفحات تحمل og:image إطلاقاً، فكل رابط يُشارك على واتساب أو لينكدإن
 * كان يظهر بلا صورة — وهو أول ما يراه المستلم قبل أي عنوان. هذه الصورة تُولَّد
 * من هوية الموقع نفسها بدل ملف ثابت يتقادم مع أول تغيير في الهوية.
 *
 * الخط من المستودع لا من الشبكة: التوليد يجري داخل دالة، وفشل جلب خط وقتها
 * يُنتج صورة بلا عربية.
 */

/**
 * satori لا يطبّق خوارزمية bidi، ولا يحترم `direction: rtl`: الحروف تتصل صحيحاً
 * لكن ترتيب الكلمات يخرج معكوساً. الحل هنا تخطيطي لا نصّي — كل كلمة عنصر في
 * صف `row-reverse` — فلا تُقلب السلسلة ولا يعتمد الناتج على ترتيب الأحرف.
 */
function ArabicLine({ text, style }: { text: string; style: Record<string, unknown> }) {
  const words = text.split(" ");
  return (
    // nowrap مقصود: التفاف الأسطر مع row-reverse يخرج بفراغات غير منتظمة في
    // satori. السطر يُقاس ليتسع، والحجم يُختار له، بدل ترك المحرك يلتف.
    <div
      style={{
        display: "flex",
        flexDirection: "row-reverse",
        justifyContent: "flex-start",
        flexWrap: "nowrap",
        ...style,
      }}
    >
      {words.map((word, index) => (
        <div key={`${word}-${index}`} style={{ display: "flex", marginLeft: index === words.length - 1 ? 0 : 14 }}>
          {word}
        </div>
      ))}
    </div>
  );
}

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "QBL — قدام بابك للخدمات اللوجستية";

export default async function OpengraphImage() {
  const [bold, regular] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Tajawal-Bold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Tajawal-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0D1B3A",
          padding: "72px 80px",
          fontFamily: "Tajawal",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20}}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 999,
              border: "12px solid #FFFFFF",
              display: "flex",
            }}
          />
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, color: "#FFFFFF", letterSpacing: -2 }}>BL</div>
          <div style={{ display: "flex", width: 10, height: 10, borderRadius: 999, background: "#00A7B6" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ArabicLine text="قدام بابك" style={{ fontSize: 72, fontWeight: 700, color: "#FFFFFF" }} />
          <ArabicLine text="للخدمات اللوجستية" style={{ fontSize: 38, color: "rgba(255,255,255,0.82)" }} />
          <ArabicLine text="توصيل مبرّد آخر ميل داخل الرياض" style={{ fontSize: 36, color: "#3FCBD6" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <ArabicLine text="تتبع الطلب وإثبات التسليم" style={{ fontSize: 28, color: "rgba(255,255,255,0.72)" }} />
          <div style={{ display: "flex", fontSize: 32, color: "#FFFFFF", letterSpacing: 1}}>qbl.sa</div>
        </div>

        <div style={{ display: "flex", position: "absolute", bottom: 0, left: 0, right: 0, height: 10, background: "#00A7B6" }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Tajawal", data: bold, weight: 700, style: "normal" },
        { name: "Tajawal", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
