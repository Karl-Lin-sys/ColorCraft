import React, { useState } from "react";
import { Sparkles, Download, Loader2, CheckCircle2 } from "lucide-react";
import jsPDF from "jspdf";

export default function ColoringBookForm() {
  const [theme, setTheme] = useState("");
  const [childName, setChildName] = useState("");
  const [size, setSize] = useState<"1K" | "2K" | "4K">("1K");

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim() || !childName.trim() || isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setError(null);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // 1. Generate Cover Page
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(36);
    pdf.text("MY COLORING BOOK", pageWidth / 2, 100, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(24);
    pdf.text(`By: ${childName}`, pageWidth / 2, 200, { align: "center" });

    pdf.setFontSize(18);
    pdf.text(`Theme: ${theme}`, pageWidth / 2, 250, { align: "center" });

    pdf.setLineWidth(2);
    pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);

    try {
      // Generate 5 pages
      for (let i = 1; i <= 5; i++) {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme, childName, size, pageIndex: i }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `Failed to generate page ${i}`);
        }

        const data = await res.json();

        pdf.addPage();

        // Add image to PDF
        // Image is base64 png
        const imgData = `data:image/png;base64,${data.imageData}`;

        // Calculate dimensions to fit A4 (aspect ratio 3:4)
        // A4 is roughly 1:1.414, we will fit it with some margin
        const margin = 20;
        const maxImgWidth = pageWidth - margin * 2;
        const maxImgHeight = pageHeight - margin * 2;

        // For 3:4 aspect ratio
        let finalWidth = maxImgWidth;
        let finalHeight = (maxImgWidth * 4) / 3;

        if (finalHeight > maxImgHeight) {
          finalHeight = maxImgHeight;
          finalWidth = (maxImgHeight * 3) / 4;
        }

        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);

        setProgress(i);
      }

      pdf.save(`${childName.replace(/\s+/g, "_")}_Coloring_Book.pdf`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 h-full flex flex-col justify-between">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">
          Book Settings
        </h2>
        <p className="text-neutral-500 mb-8">
          Customize your coloring book details below.
        </p>

        <form
          id="generate-form"
          onSubmit={handleGenerate}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Child's Name
            </label>
            <input
              type="text"
              required
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="e.g. Leo"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Book Theme
            </label>
            <input
              type="text"
              required
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Space Dinosaurs, Magical Forest..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Image Resolution
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["1K", "2K", "4K"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-2 text-sm font-medium rounded-lg transition-colors border ${
                    size === s
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              Higher resolutions take longer to generate but print sharper.
            </p>
          </div>
        </form>
      </div>

      <div className="mt-8 pt-8 border-t border-neutral-100">
        {isGenerating ? (
          <div className="bg-indigo-50 rounded-xl p-6 text-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <h3 className="font-semibold text-indigo-900">
              Drawing your book...
            </h3>
            <p className="text-indigo-700/80 text-sm mt-1 mb-4">
              Generating page {progress + 1} of 5. Please wait, this takes a
              moment.
            </p>
            <div className="h-2 w-full bg-indigo-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${(progress / 5) * 100}%` }}
              />
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 mb-4">
            {error}
          </div>
        ) : progress === 5 ? (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            Your coloring book has been generated and downloaded successfully!
          </div>
        ) : null}

        <button
          form="generate-form"
          type="submit"
          disabled={isGenerating || !theme.trim() || !childName.trim()}
          className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-medium py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Book...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate & Download PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
