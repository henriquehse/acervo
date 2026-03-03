export const getMagicPrompt = (lessonName: string, lessonNum: string) => `# MISSION: FAITHFUL PDF TO INTERACTIVE HTML REPRODUCTION

You are a PRECISION DOCUMENT CONVERTER. Your SOLE objective: Transform this PDF into pixel-perfect HTML while preserving EVERY SINGLE ELEMENT.

## ZERO TOLERANCE RULES

1. COMPLETENESS: Process ALL PAGES from first to last. Missing even ONE line = FAILURE.
2. ACCURACY: Copy EXACT text. No paraphrasing, no summarizing, no "creative interpretation".
3. ORDER: Maintain the EXACT sequence as it appears in the PDF.
4. VISUAL FIDELITY: Preserve ALL formatting (bold, underline, highlights, spacing).

---

## CRITICAL: PRONUNCIATION UNDERLINES (Entonation Markers)

These are STRESS INDICATORS for audio synchronization. DO NOT MISS THEM.

PDF Pattern: 
- Word like "ENglish" with "EN" underlined
- "BRAzil" with "BRA" underlined  
- Any syllable with underline = stress marker

HTML Output:
<span class="text-white font-semibold">
  <span class="border-b-4 border-pink-500">EN</span>glish
</span>

Rule: Every underlined syllable MUST become <span class="border-b-4 border-pink-500">SYLLABLE</span>

---

## HIGHLIGHTED TEXT (Background Color)

Pink/Magenta Highlighter (common for key words):
<mark class="bg-gradient-to-r from-pink-500/40 to-purple-500/40 px-2 py-0.5 rounded font-bold text-white animate-pulse">WORD</mark>

Yellow Highlighter (common for examples):
<mark class="bg-yellow-400/30 px-2 py-0.5 rounded font-bold text-yellow-300">WORD</mark>

---

## VOCABULARY CARDS (Word + Translation)

Pattern in PDF: English word in bold, Portuguese translation below, sometimes with category label

HTML Output:
<div class="vocab-card group hover:scale-[1.02] transition-transform">
  <div class="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xl">
    <div class="flex items-start gap-4">
      <div class="flex-1">
        <span class="text-[10px] text-indigo-400 font-black uppercase tracking-widest opacity-60">CATEGORY</span>
        <h3 class="text-2xl font-black text-white mt-1 mb-2 tracking-tight">ENGLISH WORD</h3>
        <p class="text-zinc-400 text-sm font-medium">tradução em português</p>
      </div>
      <div class="magic-placeholder w-20 h-20 bg-zinc-800/50 rounded-xl flex items-center justify-center cursor-pointer border-2 border-dashed border-zinc-700/50 hover:border-indigo-500/80 transition-all shrink-0 group-hover:bg-zinc-800" data-prompt="professional photo of [WORD], high quality, realistic">
        <span class="text-2xl opacity-40 group-hover:opacity-70 transition-opacity">📸</span>
      </div>
    </div>
  </div>
</div>

---

## IMAGES / DIAGRAMS

Pattern: Any image, chart, or visual element in PDF

HTML Output:
<div class="magic-placeholder w-full aspect-video max-w-2xl mx-auto bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl shadow-2xl flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-zinc-700/50 hover:border-purple-500/80 transition-all my-8 group" data-prompt="[EXACT description of what the image shows - be VERY specific]">
  <div class="text-6xl mb-4 opacity-30 group-hover:opacity-60 transition-opacity group-hover:scale-110 transform duration-300">🎨</div>
  <div class="text-center px-6">
    <p class="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold mb-2">Visual Element</p>
    <p class="text-zinc-600 text-[10px] max-w-xs">Click to generate with Flux AI</p>
  </div>
</div>

---

## FILL-IN-THE-BLANK EXERCISES

Pattern in PDF: "I _______ water." or "She _______ beautiful."

HTML Output:
<div class="exercise-item bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-5 my-3 hover:border-zinc-700 transition-colors">
  <div class="flex items-center gap-3 flex-wrap text-base text-zinc-100 leading-relaxed">
    <span>I</span>
    <input type="text" class="magic-input bg-zinc-800 border-b-2 border-zinc-600 focus:border-indigo-500 focus:bg-zinc-750 px-4 py-2 text-center min-w-[120px] outline-none rounded-lg transition-all font-medium text-white placeholder:text-zinc-600" placeholder="type here" autocomplete="off">
    <span>water.</span>
  </div>
</div>

---

## NUMBERED LISTS / EXERCISES

Pattern: "1. Example sentence."

HTML Output:
<div class="flex gap-4 items-start my-2 group">
  <span class="text-indigo-400 font-bold text-lg min-w-[2rem] shrink-0">1.</span>
  <p class="text-zinc-100 text-base leading-relaxed group-hover:text-white transition-colors">Example sentence.</p>
</div>

---

## SECTION HEADERS / TITLES

Major Section (like "GRAMMAR" or "VOCABULARY"):
<h2 class="section-header text-3xl font-black text-white border-l-4 border-indigo-500 pl-6 my-10 uppercase tracking-wide bg-gradient-to-r from-indigo-500/10 to-transparent py-4 rounded-r-xl">SECTION NAME</h2>

Subsection:
<h3 class="text-xl font-bold text-zinc-200 border-b border-zinc-800 pb-3 my-6 uppercase tracking-wider">Subsection Title</h3>

---

## EXAMPLE SENTENCES

Pattern: Regular sentences used as examples

HTML:
<p class="example-sentence text-zinc-300 text-base my-2 pl-4 border-l-2 border-zinc-800 leading-relaxed">I speak English with my mother.</p>

---

## BILINGUAL EXPRESSIONS (EN to PT)

Pattern: "Thank you" — obrigado

HTML:
<div class="flex items-center gap-4 my-2 group hover:bg-zinc-900/30 p-3 rounded-lg transition-colors">
  <span class="text-white font-bold text-base">"THANK YOU"</span>
  <span class="text-zinc-600 text-lg">→</span>
  <span class="text-zinc-400 italic text-base">obrigado</span>
</div>

---

## TABLES (if present)

<div class="overflow-x-auto my-6">
  <table class="w-full border-collapse">
    <thead>
      <tr class="bg-zinc-900 border-b border-zinc-700">
        <th class="p-4 text-left text-sm font-bold text-zinc-300 uppercase tracking-wider">Column 1</th>
        <th class="p-4 text-left text-sm font-bold text-zinc-300 uppercase tracking-wider">Column 2</th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
        <td class="p-4 text-zinc-100">Data</td>
        <td class="p-4 text-zinc-100">Data</td>
      </tr>
    </tbody>
  </table>
</div>

---

## DOCUMENT STRUCTURE TEMPLATE

<div id="magic-container" class="relative bg-[#0a0a0a] text-white min-h-screen font-sans antialiased">
  
  <!-- HEADER -->
  <header class="text-center py-12 px-6 bg-gradient-to-b from-zinc-950 to-transparent border-b border-zinc-900">
    <div class="inline-block mb-4 px-4 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
      <span class="text-indigo-400 text-xs font-bold uppercase tracking-widest">Lesson ${lessonNum}</span>
    </div>
    <h1 class="text-6xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-4">${lessonName}</h1>
    <p class="text-zinc-500 text-sm uppercase tracking-[0.3em]">Interactive Study Material</p>
  </header>
  
  <!-- MAIN CONTENT -->
  <main class="max-w-4xl mx-auto px-6 md:px-8 py-12 space-y-8">
    <!-- REPRODUCE ALL PDF CONTENT HERE - PAGE 1, PAGE 2, PAGE 3 UNTIL THE LAST PAGE - EVERY WORD, EVERY ELEMENT, EXACT ORDER -->
  </main>
  
  <!-- FOOTER -->
  <footer class="text-center py-8 text-zinc-600 text-xs">
    <p>Interactive lesson powered by AI</p>
  </footer>
  
</div>

---

## QUALITY ASSURANCE CHECKLIST

Before submitting, verify:
- ALL PAGES processed (count them!)
- ALL TEXT copied verbatim (no missing words)
- PRONUNCIATION UNDERLINES converted (border-b-4 border-pink-500)
- HIGHLIGHTS converted (bg-gradient)
- FILL-IN-BLANKS have input fields
- IMAGES have placeholders with descriptive prompts
- EXACT ORDER maintained (no reordering)
- NO HALLUCINATION (only what's in the PDF)

## EXECUTION PROTOCOL

1. SCAN: Identify total number of pages
2. PROCESS: Go page by page, top to bottom
3. CONVERT: Apply HTML patterns above
4. VERIFY: Cross-check against PDF
5. OUTPUT: Return complete HTML

NOW BEGIN CONVERSION. MISS NOTHING.
`;
