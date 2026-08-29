import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { BOUMA_URL, Icon, cn } from "../ui";
import appPreview from "../assets/bg.png";

/* ════════════════════════════════════════════════════════════
   بوّمة · الصفحة الرئيسية
   منشئ الامتحانات الرقمية وفق البرامج الرسمية التونسية
   (صفحة هبوط مطابقة لهوية النظام — الصور مؤقتة للاستبدال لاحقًا)
   ════════════════════════════════════════════════════════════ */

const FEATURES = [
  { icon: "school", title: "البرنامج الرسمي", text: "الدروس مرتّبة فصلاً بفصل وثلاثيًا بثلاثي، من كتب وزارة التربية وبرامجها — من السنة الأولى إلى السادسة.", color: "pine" as const },
  { icon: "wand", title: "توليد الأسئلة بالذكاء الاصطناعي", text: "الوكيل يكتب لك التمارين بنمط الفروض التونسية المعتاد، مع شبكة تقويم ودرجات واضحة.", color: "saffron" as const },
  { icon: "layers", title: "مواد تختلف من سنة لسنة", text: "كل مستوى له موادّه الصحيحة (فرنسية من السنة 3، إنقليزية وتاريخ وجغرافيا من السنة 5...) دون تمارين زائدة.", color: "blue" as const },
  { icon: "template", title: "بنية الفرض كما تعوّدت", text: "ترويسة المنشأة، أقسام المعرفة والفهم والإدماج والإبداع، ونقاط وتوقيت لكل جزء على الطريقة التونسية.", color: "tun" as const },
  { icon: "eye", title: "معاينة وطباعة", text: "تشوف الورقة كاملة قبل ما تطبعها — إخراج HTML عربي جاهز للطباعة واتجاه RTL صحيح.", color: "jasmine" as const },
  { icon: "printer", title: "شبكة الإجابة", text: "عناصر الإجابة ومقياس التقويم متاع كل تمرين، باش يكون التصحيح أسرع وأعدل.", color: "pine" as const },
];

const STEPS = [
  { icon: "school", n: "1", title: "اختر المستوى", text: "حدّد السنة (حسب المتعامل معه) والثلاثي." },
  { icon: "book", n: "2", title: "اختر المادة", text: "من المواد الرسمية المعتمدة في ذلك المستوى." },
  { icon: "clock", n: "3", title: "حدّد الإطار والدروس", text: "المدة والنقاط، ثم انتقي الدروس والكفايات المطلوبة." },
  { icon: "template", n: "4", title: "ألف التمارين وراجع", text: "أضف تمارينك أو ولّدها بالذكاء الاصطناعي، ثم راجع الورقة واطبعها." },
];

const SUBJECTS = [
  { ar: "اللغة العربية", fr: "Arabe", icon: "book", years: "1 – 6", color: "pine" as const },
  { ar: "الرياضيات", fr: "Mathématiques", icon: "sigma", years: "1 – 6", color: "blue" as const },
  { ar: "الفرنسية", fr: "Français", icon: "pen", years: "3 – 6", color: "tun" as const },
  { ar: "الإنقليزية", fr: "Anglais", icon: "chat", years: "5 – 6", color: "saffron" as const },
  { ar: "الإيقاظ العلمي / العلوم", fr: "Sciences", icon: "flask", years: "1 – 6", color: "pine" as const },
  { ar: "التربية الإسلامية", fr: "Éducation islamique", icon: "minaret", years: "1 – 6", color: "jasmine" as const },
  { ar: "التاريخ والجغرافيا", fr: "Histoire-Géographie", icon: "tunmap", years: "5 – 6", color: "saffron" as const },
  { ar: "التربية المدنية", fr: "Éducation civique", icon: "ballot", years: "1 – 6", color: "blue" as const },
];

const GRADIENTS: Record<string, string> = {
  pine: "from-pine/70 to-pine-soft",
  blue: "from-blue/70 to-blue-soft",
  saffron: "from-saffron/70 to-saffron-soft",
  tun: "from-tun/70 to-tun-soft",
  jasmine: "from-jasmine/80 to-jasmine-soft",
};

const ACCENTS: Record<string, string> = {
  pine: "bg-pine-soft text-pine-deep",
  blue: "bg-blue-soft text-blue-dark",
  saffron: "bg-saffron-soft text-saffron-dark",
  tun: "bg-tun-soft text-tun-dark",
  jasmine: "bg-jasmine-soft text-jasmine-dark",
};

const BORDERS: Record<string, string> = {
  pine: "border-pine-dark/40",
  blue: "border-blue-dark/40",
  saffron: "border-saffron-dark/40",
  tun: "border-tun-dark/40",
  jasmine: "border-jasmine-dark/50",
};

// لوحة صورة مؤقتة بأنماط الهوية (مصمَّمة للاستبدال بصور حقيقية لاحقًا)
function PlaceholderImage({ label, color = "blue", icon = "image", className }: { label: string; color?: string; icon?: string; className?: string }) {
  return (
    <div className={cn("relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br", GRADIENTS[color], className)}>
      <span className="pointer-events-none absolute -end-8 -top-10 h-32 w-32 rounded-full border-[12px] border-white/30" />
      <span className="pointer-events-none absolute -bottom-12 -start-10 h-40 w-40 rounded-full border-[14px] border-white/25" />
      <div className="z-10 flex flex-col items-center gap-3 px-6 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border-b-4 border-white/50 bg-white/70 text-ink shadow-lg">
          <Icon name={icon} size={30} />
        </span>
        <span className="font-display text-sm font-extrabold text-ink/70">{label}</span>
        <span className="rounded-md bg-ink/10 px-2 py-0.5 font-display text-[10px] font-bold tracking-wide text-ink/50">صورة · قابلة للاستبدال        </span>
      </div>
    </div>
  );
}

/* ══════ كيف يعمل · خط زمني ══════ */
const FLOW_COLORS = ["pine", "blue", "saffron", "tun"] as const;

const FLOW_TEXT: Record<string, string> = {
  pine: "text-pine-deep",
  blue: "text-blue-dark",
  saffron: "text-saffron-dark",
  tun: "text-tun-dark",
};

function HowItWorksFlow() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState<boolean[]>(() => STEPS.map(() => false));

  useEffect(() => {
    const els = rootRef.current
      ? Array.from(rootRef.current.querySelectorAll<HTMLElement>("[data-step]"))
      : [];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.step);
            setVisible((v) => {
              if (v[idx]) return v;
              const next = [...v];
              next[idx] = true;
              return next;
            });
          }
        });
      },
      { threshold: 0.3 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const fillPct = Math.round((visible.filter(Boolean).length / STEPS.length) * 100);

  return (
    <div ref={rootRef} className="relative mx-auto mt-14 max-w-5xl">
      {/* mobile rail (start side) */}
      <div className="absolute inset-y-1 start-[21px] w-[3px] -translate-x-1/2 rounded-full bg-line md:hidden" />
      <div
        className="absolute start-[21px] top-2 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-pine to-tun transition-[height] duration-700 ease-out md:hidden"
        style={{ height: `${fillPct}%` }}
      />
      {/* desktop rail (centered) */}
      <div className="absolute inset-y-1 left-1/2 hidden w-[3px] -translate-x-1/2 rounded-full bg-line md:block" />
      <div
        className="absolute left-1/2 top-2 hidden w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-pine to-tun transition-[height] duration-700 ease-out md:block"
        style={{ height: `${fillPct}%` }}
      />

      <div className="space-y-10 md:space-y-0">
        {STEPS.map((s, i) => {
          const color = FLOW_COLORS[i % FLOW_COLORS.length];
          const even = i % 2 === 0;
          const shown = visible[i];
          return (
            <div
              key={s.n}
              data-step={i}
              className={cn(
                "relative mb-0 md:mb-16 md:grid md:grid-cols-2 md:items-center md:gap-24",
                "transition-all duration-700 ease-out",
                shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              )}
            >
              <span
                className={cn(
                  "absolute start-[21px] top-7 z-10 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full border-2 font-display text-[15px] font-extrabold shadow-md md:start-1/2 md:top-1/2 md:-translate-y-1/2",
                  "transition-transform duration-500",
                  ACCENTS[color],
                  BORDERS[color],
                  shown ? "scale-100" : "scale-50"
                )}
              >
                {s.n}
              </span>

              <div
                className={cn(
                  "ps-16 md:ps-0",
                  even
                    ? "md:col-start-1 md:items-start md:pe-14 md:text-start"
                    : "md:col-start-2 md:items-end md:ps-14 md:text-end"
                )}
              >
                <span className={cn("font-display text-[11px] font-extrabold tracking-wide", FLOW_TEXT[color])}>
                  الخطوة {s.n}
                </span>
                <div className={cn("mt-2 flex items-start gap-3", even ? "md:justify-start" : "md:flex-row-reverse")}>
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-xl border-b-4 border-white/40",
                      ACCENTS[color]
                    )}
                  >
                    <Icon name={s.icon} size={20} />
                  </span>
                  <div className={cn(even ? "md:text-start" : "md:text-end")}>
                    <h3 className="font-display text-[17px] font-extrabold text-ink">{s.title}</h3>
                    <p className="mt-1 max-w-md text-[13px] font-medium leading-relaxed text-sub">{s.text}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* ══════ شريط التنقل ══════ */}
      <header className="no-print sticky top-0 z-40 border-b-2 border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <span className="absolute -inset-1 rounded-full border-2 border-dashed border-pine/50" />
              <img src={BOUMA_URL} alt="بوّمة" className="relative h-10 w-10 rounded-full border-2 border-line object-cover" />
            </div>
            <div>
              <span className="block font-display text-[20px] font-extrabold leading-none text-ink">بوّمة</span>
              <span className="block text-[10.5px] font-bold tracking-wide text-sub">منشئ الامتحانات · التعليم الأساسي</span>
            </div>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="font-display text-[13.5px] font-bold text-sub transition-colors hover:text-pine-deep">المميزات</a>
            <a href="#how" className="font-display text-[13.5px] font-bold text-sub transition-colors hover:text-pine-deep">كيف يعمل</a>
            <a href="#subjects" className="font-display text-[13.5px] font-bold text-sub transition-colors hover:text-pine-deep">المواد</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-xl px-4 py-2 font-display text-[13.5px] font-bold text-pine-deep transition-colors hover:bg-pine-soft sm:inline-flex">
              تسجيل الدخول
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-xl border-b-4 border-pine-dark bg-pine px-4 py-2 font-display text-[13.5px] font-extrabold text-ink transition-all hover:-translate-y-0.5 active:translate-y-0 active:border-b-2"
            >
              ابدأ الآن
            </Link>
          </div>
        </div>
      </header>

      {/* ══════ القسم الرئيسي (Hero) ══════ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-4 px-4 py-16 md:grid-cols-2 md:gap-10 md:px-8 md:py-24">
          <div className="anim-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-pine-dark/30 bg-pine-soft px-3 py-1 font-display text-[12px] font-extrabold text-pine-deep">
              <Icon name="seal" size={15} /> وفق البرامج الرسمية لوزارة التربية
            </span>
            <h1 className="mt-5 font-display text-[34px] font-extrabold leading-[1.35] text-ink md:text-[44px]">
              حضّر امتحاناتك
              <span className="hl mx-1">في وقت وجيز</span>
              بمساعدة الذكاء الاصطناعي
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] font-medium leading-relaxed text-sub">
              بوّمة توفّر عليك عناء تركيب الفروض للمرحلة الابتدائية. تختار المستوى والمادة والدروس، وتولّد التمارين على نمط ما يعتاده الأساتذة، وتطبع الورقة جاهزة.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-xl border-b-4 border-pine-dark bg-pine px-6 py-3.5 font-display text-[15px] font-extrabold text-ink transition-all hover:-translate-y-0.5 active:translate-y-0 active:border-b-2"
              >
                <Icon name="wand" size={19} /> أنشئ امتحانك
                <Icon name="arrowNext" size={18} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border-2 border-line bg-white px-6 py-3.5 font-display text-[15px] font-extrabold text-ink shadow-[0_4px_0_#dfe6ea] transition-all hover:-translate-y-0.5">
                تسجيل الدخول
              </Link>
            </div>
          </div>

          {/* صورة ترويجية */}
          <div className="anim-in-start relative">
            <div className="anim-float relative z-10 h-72 md:h-96">
              <img src={appPreview} alt="لقطة من منشئ الامتحانات — بوّمة" className="h-full w-full object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════ شريط الإحصاء ══════ */}
      <section className="border-y-2 border-line bg-white/70">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-4 py-8 md:grid-cols-4 md:px-8">
          {[
            { big: "البرنامج الرسمي", icon: "book" },
            { big: "أسئلة بنمط حقيقي", icon: "pen" },
            { big: "توليد بالذكاء الاصطناعي", icon: "wand" },
            { big: "طباعة فورية", icon: "printer" },
          ].map((s) => (
            <div key={s.big} className="flex items-center justify-center gap-2 py-3 text-center">
              <Icon name={s.icon} size={18} className="shrink-0 text-pine-deep" />
              <span className="font-display text-[14px] font-extrabold text-ink">{s.big}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ المميزات ══════ */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="hl font-display text-[12.5px] font-extrabold tracking-wide" style={{ "--hl": "var(--color-pine-soft)" } as CSSProperties}>المميزات</span>
          <h2 className="mt-2 font-display text-[28px] font-extrabold text-ink md:text-[34px]">كل ما تحتاجه لتحضير الفرض</h2>
          <p className="mt-3 text-[14.5px] font-medium text-sub">من اختيار المستوى إلى الورقة النهائية، كل خطوة محسوبة على المنهاج التونسي.</p>
        </div>
        <div className="stagger-up mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card group p-5 transition-all hover:-translate-y-1 hover:shadow-[0_6px_0_#dfe6ea]">
              <span className={cn("grid h-12 w-12 place-items-center rounded-xl border-b-4 border-white/40", ACCENTS[f.color])}>
                <Icon name={f.icon} size={22} />
              </span>
              <h3 className="mt-4 font-display text-[16px] font-extrabold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-sub">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ كيف يعمل ══════ */}
      <section id="how" className="border-y-2 border-line bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="hl font-display text-[12.5px] font-extrabold tracking-wide" style={{ "--hl": "var(--color-saffron-soft)" } as CSSProperties}>كيف يعمل</span>
            <h2 className="mt-2 font-display text-[28px] font-extrabold text-ink md:text-[34px]">4 خطوات حتى الورقة الجاهزة</h2>
          </div>
          <HowItWorksFlow />
        </div>
      </section>

      {/* ══════ المواد ══════ */}
      <section id="subjects" className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="hl font-display text-[12.5px] font-extrabold tracking-wide" style={{ "--hl": "var(--color-blue-soft)" } as CSSProperties}>المواد</span>
            <h2 className="mt-2 font-display text-[28px] font-extrabold text-ink md:text-[34px]">مقرّرات المرحلة الابتدائية</h2>
            <p className="mt-2 max-w-xl text-[14.5px] font-medium text-sub">كل مادة تعرض وفق برنامجها الرسمي، مع السنوات التي تدرَّس فيها.</p>
          </div>
        </div>
        <div className="stagger-up mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUBJECTS.map((s) => (
            <div key={s.ar} className="card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_6px_0_#dfe6ea]">
              <div className={cn("h-28", GRADIENTS[s.color])}>
                <PlaceholderImage label={s.ar} color={s.color} icon={s.icon} className="h-full rounded-none bg-transparent" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-[15px] font-extrabold text-ink">{s.ar}</h3>
                  <span className={cn("rounded-md border px-1.5 py-0.5 font-display text-[11px] font-extrabold", BORDERS[s.color], ACCENTS[s.color])}>
                    {s.years}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11.5px] font-semibold text-faint" dir="ltr" style={{ textAlign: "end" }}>{s.fr}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ النداء الأخير ══════ */}
      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pine via-pine to-pine-soft p-8 text-center shadow-[0_10px_0_#0a7f6d] md:p-14">
          <span className="pointer-events-none absolute -end-10 -top-14 h-48 w-48 rounded-full border-[16px] border-white/20" />
          <span className="pointer-events-none absolute -bottom-16 -start-10 h-56 w-56 rounded-full border-[18px] border-white/15" />
          <div className="relative">
            <h2 className="font-display text-[28px] font-extrabold text-ink md:text-[36px]">جهّز فرضك القادم في وقت قليل</h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] font-semibold text-ink/80">
              فروض مضبوطة وفق المنهاج الرسمي ودون إضاعة وقت الاستعداد.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-xl border-b-4 border-pine-deep bg-ink px-7 py-4 font-display text-[16px] font-extrabold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 active:border-b-2"
              >
                <Icon name="wand" size={20} /> ابدأ الآن مجانًا
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border-2 border-ink/20 bg-white/70 px-7 py-4 font-display text-[15px] font-extrabold text-ink transition-all hover:-translate-y-0.5">
                الدخول
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ التذييل ══════ */}
      <footer className="border-t-2 border-line bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-8">
          <div className="flex items-center gap-2.5">
            <img src={BOUMA_URL} alt="بوّمة" className="h-9 w-9 rounded-full border-2 border-line object-cover" />
            <div>
              <span className="block font-display text-[15px] font-extrabold text-ink">بوّمة</span>
              <span className="block text-[11px] font-medium text-faint">منشئ الامتحانات · التعليم الأساسي</span>
            </div>
          </div>
          <p className="text-center text-[11.5px] font-medium text-faint">
            وفق البرامج الرسمية لوزارة التربية — الجمهورية التونسية
          </p>
          <div className="flex items-center gap-1.5">
            {["book", "flask", "arch", "seal"].map((i) => (
              <span key={i} className="grid h-9 w-9 place-items-center rounded-xl border-2 border-line bg-white text-sub">
                <Icon name={i} size={16} />
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
