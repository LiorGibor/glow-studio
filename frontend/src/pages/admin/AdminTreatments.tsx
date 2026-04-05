import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePhotograph,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineDuplicate,
  HiOutlineMenu,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { treatmentService, treatmentReorderService } from "@/lib/services";
import { formatPrice, formatDuration, getPlaceholderImage } from "@/lib/utils";
import type { Treatment, TreatmentCreate } from "@/types";

// ── Status badge ────────────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {active ? t("treatmentsAdmin.active") : t("treatmentsAdmin.inactive")}
    </span>
  );
}

// ── Sortable card wrapper ───────────────────────────────────────────────

function SortableTreatmentCard({
  id,
  children,
}: {
  id: number;
  children: (dragHandleProps: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
  }) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}

// ── Empty form state ────────────────────────────────────────────────────

const emptyForm: TreatmentCreate = {
  name: "",
  category: "",
  description: "",
  short_description: "",
  duration_minutes: 30,
  price: 0,
  is_active: true,
  sort_order: 0,
};

// ── Component ───────────────────────────────────────────────────────────

export default function AdminTreatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TreatmentCreate>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  // Fetch treatments
  const fetchTreatments = async () => {
    setLoading(true);
    try {
      const data = await treatmentService.list();
      setTreatments(data);
    } catch {
      toast.error(t("treatmentsAdmin.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  // Filtered treatments
  const filtered = treatments.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  // Open create modal
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setGalleryFiles([]);
    setShowModal(true);
  };

  // Open edit modal
  const openEdit = (treatment: Treatment) => {
    setEditingId(treatment.id);
    setForm({
      name: treatment.name,
      category: treatment.category,
      description: treatment.description || "",
      short_description: treatment.short_description || "",
      duration_minutes: treatment.duration_minutes,
      price: treatment.price,
      is_active: treatment.is_active,
      sort_order: treatment.sort_order,
    });
    setImageFile(null);
    setGalleryFiles([]);
    setShowModal(true);
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Drag end handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = treatments.findIndex((t) => t.id === active.id);
    const newIndex = treatments.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(treatments, oldIndex, newIndex);
    setTreatments(reordered);

    const items = reordered.map((t, i) => ({ id: t.id, sort_order: i }));
    try {
      await treatmentReorderService.reorder(items);
      toast.success(t("treatmentsAdmin.reordered"));
    } catch {
      toast.error(t("treatmentsAdmin.saveError"));
      fetchTreatments();
    }
  };

  // Duplicate treatment
  const handleDuplicate = async (treatment: Treatment) => {
    try {
      const duplicateData: TreatmentCreate = {
        name: `העתק - ${treatment.name}`,
        category: treatment.category,
        description: treatment.description || "",
        short_description: treatment.short_description || "",
        duration_minutes: treatment.duration_minutes,
        price: treatment.price,
        is_active: treatment.is_active,
        sort_order: treatment.sort_order,
      };
      const newTreatment = await treatmentService.create(duplicateData);
      toast.success(t("treatmentsAdmin.duplicated"));
      await fetchTreatments();
      openEdit(newTreatment);
    } catch {
      toast.error(t("treatmentsAdmin.saveError"));
    }
  };

  // Save
  const handleSave = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      toast.error(t("treatmentsAdmin.nameRequired"));
      return;
    }
    if (form.duration_minutes <= 0) {
      toast.error(t("treatmentsAdmin.durationRequired"));
      return;
    }

    setSaving(true);
    try {
      let treatment: Treatment;
      if (editingId) {
        treatment = await treatmentService.update(editingId, form);
        toast.success(t("treatmentsAdmin.updated"));
      } else {
        treatment = await treatmentService.create(form);
        toast.success(t("treatmentsAdmin.created"));
      }

      // Upload image if selected
      if (imageFile) {
        await treatmentService.uploadImage(treatment.id, imageFile);
      }

      // Upload gallery if selected
      if (galleryFiles.length > 0) {
        await treatmentService.uploadGallery(treatment.id, galleryFiles);
      }

      setShowModal(false);
      fetchTreatments();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t("treatmentsAdmin.saveError");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (treatment: Treatment) => {
    if (!confirm(t("treatmentsAdmin.deactivateConfirm", { name: treatment.name }))) return;

    try {
      await treatmentService.delete(treatment.id);
      toast.success(t("treatmentsAdmin.deactivated"));
      fetchTreatments();
    } catch {
      toast.error(t("treatmentsAdmin.deactivateError"));
    }
  };

  // Field updater
  const setField = <K extends keyof TreatmentCreate>(
    key: K,
    value: TreatmentCreate[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("treatmentsAdmin.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("treatmentsAdmin.subtitle")}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium text-sm shadow-sm hover:shadow-md transition"
        >
          <HiOutlinePlus className="w-5 h-5" />
          {t("treatmentsAdmin.addTreatment")}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <HiOutlineSearch className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t("treatmentsAdmin.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full ps-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
        />
      </div>

      {/* Treatment cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filtered.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div className="h-40 skeleton" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 w-3/4 rounded skeleton" />
                      <div className="h-4 w-1/2 rounded skeleton" />
                      <div className="h-4 w-full rounded skeleton" />
                    </div>
                  </div>
                ))
              : filtered.map((treatment) => (
                  <SortableTreatmentCard key={treatment.id} id={treatment.id}>
                    {({ attributes, listeners }) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group"
                      >
                        {/* Image */}
                        <div className="relative h-40 bg-gray-100 overflow-hidden">
                          <img
                            src={treatment.image_url || getPlaceholderImage(treatment.category)}
                            alt={treatment.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 start-3">
                            <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-medium text-gray-700">
                              {treatment.category}
                            </span>
                          </div>
                          <div className="absolute top-3 end-3">
                            <ActiveBadge active={treatment.is_active} />
                          </div>
                          {/* Drag handle */}
                          <button
                            {...attributes}
                            {...listeners}
                            className="absolute bottom-3 start-3 p-1.5 rounded-lg bg-white/90 backdrop-blur text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing transition"
                            title={t("treatmentsAdmin.reorder")}
                          >
                            <HiOutlineMenu className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {treatment.name}
                          </h3>
                          <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                            {treatment.short_description || treatment.description || "No description"}
                          </p>

                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                            <span>{formatDuration(treatment.duration_minutes)}</span>
                            <span className="text-gray-300">|</span>
                            <span className="font-medium text-primary-600">
                              {formatPrice(treatment.price)}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(treatment)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                              {t("treatmentsAdmin.edit")}
                            </button>
                            <button
                              onClick={() => handleDuplicate(treatment)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                              title={t("treatmentsAdmin.duplicate")}
                            >
                              <HiOutlineDuplicate className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(treatment)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </SortableTreatmentCard>
                ))}
          </motion.div>
        </SortableContext>
      </DndContext>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <HiOutlinePhotograph className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">{t("treatmentsAdmin.noTreatments")}</p>
          <p className="text-sm mt-1">
            {search ? t("treatmentsAdmin.noTreatmentsSearch") : t("treatmentsAdmin.noTreatmentsEmpty")}
          </p>
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg mb-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingId ? t("treatmentsAdmin.editTreatment") : t("treatmentsAdmin.newTreatment")}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <HiOutlineX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("treatmentsAdmin.nameLabel")}
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder={t("treatmentsAdmin.namePlaceholder")}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("treatmentsAdmin.categoryLabel")}
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    placeholder={t("treatmentsAdmin.categoryPlaceholder")}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>

                {/* Duration + Price row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("treatmentsAdmin.durationLabel")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.duration_minutes}
                      onChange={(e) =>
                        setField("duration_minutes", parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("treatmentsAdmin.priceLabel")}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={form.price}
                      onChange={(e) =>
                        setField("price", parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Short description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("treatmentsAdmin.shortDescLabel")}
                  </label>
                  <input
                    type="text"
                    value={form.short_description || ""}
                    onChange={(e) => setField("short_description", e.target.value)}
                    placeholder={t("treatmentsAdmin.shortDescPlaceholder")}
                    maxLength={300}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>

                {/* Full description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("treatmentsAdmin.fullDescLabel")}
                  </label>
                  <textarea
                    value={form.description || ""}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder={t("treatmentsAdmin.fullDescPlaceholder")}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                  />
                </div>

                {/* Sort order + Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("treatmentsAdmin.sortOrderLabel")}
                    </label>
                    <input
                      type="number"
                      value={form.sort_order || 0}
                      onChange={(e) =>
                        setField("sort_order", parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setField("is_active", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                      />
                      <span className="text-sm text-gray-700">{t("treatmentsAdmin.activeLabel")}</span>
                    </label>
                  </div>
                </div>

                {/* Main image upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("treatmentsAdmin.mainImage")}
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition"
                  >
                    <HiOutlinePhotograph className="w-5 h-5" />
                    {imageFile ? imageFile.name : t("treatmentsAdmin.chooseImage")}
                  </button>
                </div>

                {/* Gallery upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("treatmentsAdmin.galleryImages")}
                  </label>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      setGalleryFiles(Array.from(e.target.files || []))
                    }
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition"
                  >
                    <HiOutlinePhotograph className="w-5 h-5" />
                    {galleryFiles.length > 0
                      ? t("treatmentsAdmin.filesSelected", { count: galleryFiles.length })
                      : t("treatmentsAdmin.chooseGallery")}
                  </button>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  {t("treatmentsAdmin.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium shadow-sm hover:shadow-md transition disabled:opacity-50"
                >
                  {saving ? t("treatmentsAdmin.saving") : editingId ? t("treatmentsAdmin.update") : t("treatmentsAdmin.create")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
