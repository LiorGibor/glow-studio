import { clsx } from "clsx";
import i18n from "@/i18n";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return clsx(inputs);
}

export function formatPrice(price: number): string {
  const locale = i18n.language === "he" ? "he-IL" : "en-US";
  return `${price.toLocaleString(locale)} \u20AA`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return i18n.language === "he" ? `${minutes} דק׳` : `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (i18n.language === "he") {
    return m > 0 ? `${h} שע׳ ${m} דק׳` : `${h} שע׳`;
  }
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Eyebrows: "👁",
    Nails: "💅",
    Makeup: "💄",
    Lashes: "✨",
    Skincare: "🧴",
  };
  return icons[category] || "💎";
}

export function getCategoryGradient(category: string): string {
  const gradients: Record<string, string> = {
    Eyebrows: "from-amber-400 to-orange-500",
    Nails: "from-pink-400 to-rose-500",
    Makeup: "from-purple-400 to-indigo-500",
    Lashes: "from-violet-400 to-purple-500",
    Skincare: "from-teal-400 to-emerald-500",
  };
  return gradients[category] || "from-primary-400 to-primary-600";
}

export function getPlaceholderImage(category: string): string {
  const images: Record<string, string> = {
    Eyebrows:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&h=400&fit=crop",
    Nails:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop",
    Makeup:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop",
    Lashes:
      "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=600&h=400&fit=crop",
    Skincare:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop",
  };
  return (
    images[category] ||
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop"
  );
}
