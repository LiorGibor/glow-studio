import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineArrowLeft,
} from "react-icons/hi";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { treatmentService } from "@/lib/services";
import {
  formatPrice,
  formatDuration,
  getPlaceholderImage,
  getCategoryIcon,
  getCategoryGradient,
} from "@/lib/utils";
import type { Treatment } from "@/types";

// ── Animation helpers ───────────────────────────────────────────────────

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: d * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

// ── Skeleton ────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-64 sm:h-80 skeleton" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-5">
        <div className="h-5 w-24 rounded skeleton" />
        <div className="h-8 w-2/3 rounded skeleton" />
        <div className="h-4 w-full rounded skeleton" />
        <div className="h-4 w-5/6 rounded skeleton" />
        <div className="h-4 w-4/6 rounded skeleton" />
        <div className="flex gap-6 pt-4">
          <div className="h-10 w-28 rounded-xl skeleton" />
          <div className="h-10 w-28 rounded-xl skeleton" />
        </div>
      </div>
    </div>
  );
}

// ── Treatment Page ──────────────────────────────────────────────────────

export default function TreatmentPage() {
  const { slug } = useParams<{ slug: string }>();
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!slug) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    treatmentService
      .getBySlug(slug)
      .then(setTreatment)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton />;

  if (error || !treatment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h2 className="font-display text-2xl font-bold text-gray-900">
          {t("treatments.notFound")}
        </h2>
        <p className="text-gray-500">
          {t("treatments.notFoundDesc")}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-white font-medium
                     hover:bg-primary-600 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          {t("treatments.backHome")}
        </Link>
      </div>
    );
  }

  const image = treatment.image_url || getPlaceholderImage(treatment.category);
  const gradient = getCategoryGradient(treatment.category);
  const icon = getCategoryIcon(treatment.category);

  // Parse gallery
  let gallery: string[] = [];
  if (treatment.gallery_urls) {
    try {
      gallery = JSON.parse(treatment.gallery_urls);
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Hero image ──────────────────────────────────────────────── */}
      <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
        <img
          src={image}
          alt={treatment.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Back button */}
        <Link
          to="/"
          className="absolute top-4 start-4 sm:top-6 sm:start-6 inline-flex items-center gap-1.5
                     px-3.5 py-2 rounded-full glass text-sm font-medium text-gray-800
                     hover:bg-white/90 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          {t("treatments.back")}
        </Link>

        {/* Category badge */}
        <span
          className={`absolute bottom-4 start-4 sm:bottom-6 sm:start-6 inline-flex items-center gap-1
                      px-3 py-1.5 rounded-full text-sm font-medium text-white
                      bg-gradient-to-r ${gradient} shadow-md`}
        >
          <span>{icon}</span>
          {treatment.category}
        </span>
      </div>

      {/* ─── Content ─────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <motion.h1
          custom={0}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight"
        >
          {treatment.name}
        </motion.h1>

        {/* Quick stats */}
        <motion.div
          custom={1}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mt-5 flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-50 text-primary-700">
            <HiOutlineClock className="w-5 h-5" />
            <span className="text-sm font-medium">{formatDuration(treatment.duration_minutes)}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-50 text-primary-700">
            <HiOutlineCurrencyDollar className="w-5 h-5" />
            <span className="text-sm font-medium">{formatPrice(treatment.price)}</span>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          custom={2}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mt-8"
        >
          <h2 className="font-display text-xl font-semibold text-gray-900 mb-3">
            {t("treatments.aboutTitle")}
          </h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
            {treatment.description || treatment.short_description || t("treatments.noDescription")}
          </p>
        </motion.div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <motion.div
            custom={3}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="mt-10"
          >
            <h2 className="font-display text-xl font-semibold text-gray-900 mb-4">
              {t("treatments.gallery")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((url, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.03 }}
                  className="rounded-xl overflow-hidden aspect-square"
                >
                  <img
                    src={url}
                    alt={`${treatment.name} gallery ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          custom={4}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mt-12"
        >
          <Link
            to={`/book/${treatment.slug}`}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 rounded-full
                       bg-primary-500 text-white text-base font-semibold
                       shadow-lg shadow-primary-300/40 hover:bg-primary-600
                       active:scale-[0.97] transition-all duration-200"
          >
            <Sparkles className="w-5 h-5" />
            {t("treatments.bookThis")}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
