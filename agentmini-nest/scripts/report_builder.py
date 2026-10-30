"""Robust .docx builder for the AgentMini-Nest project report.

Design decisions that the previous iteration got wrong and that this revision
fixes explicitly:

  1. Vietnamese diacritics rendered as boxes / wrong glyphs because the
     eastAsia rFonts slot was missing on most runs. Word picks a fallback
     font for any code point that the run's rFonts does not cover. The fix
     here is the helper apply_font() which writes ALL four rFonts slots
     (ascii, hAnsi, cs, eastAsia) on each run we add — never relying on the
     Normal style propagation, since headings and tables have their own
     style chain.

  2. Tables came out with random column widths. python-docx's `.width = Cm(...)`
     on a Cell is advisory; Word ignores it unless the table layout is fixed.
     This revision sets `tblLayout val="fixed"` and `tblW type="dxa"` plus
     writes `tcW` on every cell. Column widths are now honoured.

  3. Captions, bullets and headings now share one font/size policy via apply_font.

  4. Each chapter starts on a new page; abstract page break preserved.

Tables: caption above ("Bảng X.Y" / "Table X.Y"). Figures: caption below.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

BODY_FONT = "Times New Roman"
MONO_FONT = "Consolas"          # widely available + Vietnamese coverage; falls back to Courier New
CODE_BG   = "F4F4F4"


# ── Content model ────────────────────────────────────────────────────────────

@dataclass
class TableSpec:
    caption: str
    headers: list[str]
    rows: list[list[str]]
    column_widths_cm: Optional[list[float]] = None


@dataclass
class FigureSpec:
    caption: str
    image_path: Path
    width_cm: float = 14.5


@dataclass
class CodeListingSpec:
    caption: str
    language: str
    code: str


@dataclass
class Section:
    title: str
    level: int = 1
    paragraphs: list[str] = field(default_factory=list)
    children: list["Section"] = field(default_factory=list)
    tables: list[TableSpec] = field(default_factory=list)
    figures: list[FigureSpec] = field(default_factory=list)
    listings: list[CodeListingSpec] = field(default_factory=list)
    bullets: list[list[str]] = field(default_factory=list)


@dataclass
class Report:
    title: str
    subtitle: str
    author: str
    institution: str
    year: str
    abstract: str
    keywords: list[str]
    table_label: str
    figure_label: str
    abstract_label: str
    keywords_label: str
    toc_label: str
    list_tables_label: str
    list_figures_label: str
    references_label: str
    references: list[str]
    chapters: list[Section]
    # Optional front-matter; left as parametrised content
    acknowledgement_title: str = "Lời cảm ơn"
    acknowledgement_text: str = ""
    declaration_title: str = "Lời cam đoan"
    declaration_text: str = ""
    abbreviations_title: str = "Danh mục từ viết tắt"
    abbreviations: Optional[list[tuple[str, str]]] = None


# ── Low-level XML helpers ────────────────────────────────────────────────────

def apply_font(run, font_name=BODY_FONT, size_pt: Optional[float] = None,
               bold: Optional[bool] = None, italic: Optional[bool] = None,
               color_hex: Optional[str] = None, shading_hex: Optional[str] = None):
    """Apply complete font information to a run.

    Crucially writes rFonts ascii/hAnsi/cs/eastAsia so Vietnamese diacritics
    do not fall through to a substitute font.
    """
    if size_pt is not None:
        run.font.size = Pt(size_pt)
    if bold is not None:
        run.font.bold = bold
    if italic is not None:
        run.font.italic = italic
    if color_hex:
        run.font.color.rgb = RGBColor.from_string(color_hex)

    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    for attr in ("ascii", "hAnsi", "cs", "eastAsia"):
        rFonts.set(qn(f"w:{attr}"), font_name)

    if shading_hex:
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear")
        shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), shading_hex)
        # Remove any existing shading
        for el in rPr.findall(qn("w:shd")):
            rPr.remove(el)
        rPr.append(shd)


def apply_font_to_style(doc, style_name, font_name=BODY_FONT, size_pt: Optional[float] = None,
                         bold: Optional[bool] = None):
    """Set rFonts on a named style (Heading 1, Heading 2, etc.)."""
    if style_name not in doc.styles:
        return
    style = doc.styles[style_name]
    if size_pt is not None:
        style.font.size = Pt(size_pt)
    if bold is not None:
        style.font.bold = bold
    rPr = style.element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    for attr in ("ascii", "hAnsi", "cs", "eastAsia"):
        rFonts.set(qn(f"w:{attr}"), font_name)


def set_cell_borders(cell, sz=4, color="404040"):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        b = OxmlElement(f"w:{edge}")
        b.set(qn("w:val"), "single")
        b.set(qn("w:sz"), str(sz))
        b.set(qn("w:color"), color)
        tcBorders.append(b)
    # Remove old borders first
    for old in tcPr.findall(qn("w:tcBorders")):
        tcPr.remove(old)
    tcPr.append(tcBorders)


def set_cell_shading(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    for old in tcPr.findall(qn("w:shd")):
        tcPr.remove(old)
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill_hex)
    tcPr.append(shd)


def set_cell_width(cell, width_cm):
    """Force a column width by writing tcW directly on the cell XML."""
    tcPr = cell._tc.get_or_add_tcPr()
    for old in tcPr.findall(qn("w:tcW")):
        tcPr.remove(old)
    tcW = OxmlElement("w:tcW")
    tcW.set(qn("w:type"), "dxa")           # 1/20 of a point
    tcW.set(qn("w:w"), str(int(width_cm * 567)))  # 1 cm ≈ 567 dxa
    tcPr.append(tcW)


def set_table_fixed_layout(table, total_cm):
    tbl = table._tbl
    tblPr = tbl.find(qn("w:tblPr"))
    if tblPr is None:
        tblPr = OxmlElement("w:tblPr")
        tbl.insert(0, tblPr)
    for old in tblPr.findall(qn("w:tblLayout")):
        tblPr.remove(old)
    tblLayout = OxmlElement("w:tblLayout")
    tblLayout.set(qn("w:type"), "fixed")
    tblPr.append(tblLayout)
    # Set total width
    for old in tblPr.findall(qn("w:tblW")):
        tblPr.remove(old)
    tblW = OxmlElement("w:tblW")
    tblW.set(qn("w:type"), "dxa")
    tblW.set(qn("w:w"), str(int(total_cm * 567)))
    tblPr.append(tblW)


# ── Paragraph helpers ───────────────────────────────────────────────────────

def add_body_paragraph(doc, text, *, indent_first=True, size_pt=12):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_after = Pt(6)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    if indent_first:
        p.paragraph_format.first_line_indent = Cm(1.0)
    run = p.add_run(text)
    apply_font(run, BODY_FONT, size_pt)
    return p


def add_caption(doc, text, *, before_table):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if before_table:
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
    else:
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(10)
    run = p.add_run(text)
    apply_font(run, BODY_FONT, size_pt=10.5, italic=True)
    return p


def add_heading(doc, text, level):
    """Use the named style but write run + font ourselves so VN displays correctly."""
    p = doc.add_paragraph()
    p.style = doc.styles[f"Heading {level}"]
    p.paragraph_format.space_before = Pt(18 if level == 1 else 12)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    size_map = {1: 16, 2: 13, 3: 12, 4: 11}
    run = p.add_run(text)
    apply_font(run, BODY_FONT, size_pt=size_map.get(level, 12), bold=True,
               color_hex="1F3864")
    return p


def add_table_with_caption(doc, spec: TableSpec, number_label: str):
    add_caption(doc, f"{number_label}: {spec.caption}", before_table=True)
    n_cols = len(spec.headers)
    widths = spec.column_widths_cm or [15.5 / n_cols] * n_cols
    total = sum(widths)

    table = doc.add_table(rows=1 + len(spec.rows), cols=n_cols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_fixed_layout(table, total)

    # Header row
    for i, header_text in enumerate(spec.headers):
        cell = table.rows[0].cells[i]
        cell.text = ""
        para = cell.paragraphs[0]
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = para.add_run(header_text)
        apply_font(r, BODY_FONT, size_pt=10.5, bold=True)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        set_cell_borders(cell, sz=8)
        set_cell_shading(cell, "DCE6F2")
        set_cell_width(cell, widths[i])

    # Body rows
    for r_idx, row in enumerate(spec.rows, start=1):
        for c_idx, val in enumerate(row):
            cell = table.rows[r_idx].cells[c_idx]
            cell.text = ""
            para = cell.paragraphs[0]
            para.alignment = WD_ALIGN_PARAGRAPH.LEFT
            para.paragraph_format.line_spacing = 1.2
            run = para.add_run(str(val) if val is not None else "")
            apply_font(run, BODY_FONT, size_pt=10.5)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP
            set_cell_borders(cell, sz=4)
            set_cell_width(cell, widths[c_idx])


def add_figure_with_caption(doc, spec: FigureSpec, number_label: str):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    run = p.add_run()
    run.add_picture(str(spec.image_path), width=Cm(spec.width_cm))
    add_caption(doc, f"{number_label}: {spec.caption}", before_table=False)


def add_code_listing(doc, spec: CodeListingSpec):
    """Code block rendered as a single-cell shaded table with monospace font."""
    # Caption above (italic, small)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(f"{spec.language}: {spec.caption}")
    apply_font(run, BODY_FONT, size_pt=10, italic=True, color_hex="555555")

    table = doc.add_table(rows=1, cols=1)
    table.autofit = False
    set_table_fixed_layout(table, 15.5)
    cell = table.rows[0].cells[0]
    set_cell_shading(cell, CODE_BG)
    set_cell_borders(cell, sz=4, color="888888")
    set_cell_width(cell, 15.5)
    cell.text = ""
    for line in spec.code.split("\n"):
        para = cell.add_paragraph()
        para.paragraph_format.line_spacing = 1.15
        para.paragraph_format.space_after = Pt(0)
        r = para.add_run(line if line else " ")
        apply_font(r, MONO_FONT, size_pt=9.5)
    # Remove the empty first paragraph we got from cell.text = ""
    first = cell.paragraphs[0]
    if first.text == "" and len(first.runs) == 0 and len(cell.paragraphs) > 1:
        first._element.getparent().remove(first._element)


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.line_spacing = 1.4
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(item)
        apply_font(run, BODY_FONT, size_pt=12)


# ── Layout shells ───────────────────────────────────────────────────────────

def add_cover(doc, report: Report):
    def centered_run(text, *, size, bold=False, italic=False, color_hex=None, space=4):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(space)
        r = p.add_run(text)
        apply_font(r, BODY_FONT, size_pt=size, bold=bold, italic=italic, color_hex=color_hex)

    for _ in range(2):
        doc.add_paragraph()
    centered_run(report.institution.upper(), size=14, bold=True, space=4)
    centered_run("BÁO CÁO ĐỒ ÁN TỐT NGHIỆP / GRADUATION PROJECT REPORT", size=12, italic=True, color_hex="666666")
    for _ in range(3):
        doc.add_paragraph()
    centered_run(report.title.upper(), size=24, bold=True, color_hex="1F3864", space=8)
    centered_run(report.subtitle, size=14, italic=True, color_hex="333333", space=20)
    for _ in range(6):
        doc.add_paragraph()
    centered_run(report.author, size=13)
    centered_run(report.year, size=12, italic=True)
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def add_abstract(doc, report: Report):
    add_heading(doc, report.abstract_label, level=1)
    add_body_paragraph(doc, report.abstract, indent_first=False)

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.4
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.first_line_indent = Cm(0)
    r1 = p.add_run(f"{report.keywords_label}: ")
    apply_font(r1, BODY_FONT, size_pt=12, bold=True)
    r2 = p.add_run(", ".join(report.keywords) + ".")
    apply_font(r2, BODY_FONT, size_pt=12)
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def _add_field_paragraph(doc, instr_text: str, placeholder: str):
    """Insert a Word field (TOC, list of figures, etc.) — populated on Update Field."""
    p = doc.add_paragraph()
    run = p.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    fld_begin.set(qn("w:dirty"), "true")
    run._element.append(fld_begin)

    run2 = p.add_run()
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = instr_text
    run2._element.append(instr)

    run3 = p.add_run()
    sep = OxmlElement("w:fldChar")
    sep.set(qn("w:fldCharType"), "separate")
    run3._element.append(sep)

    run4 = p.add_run(placeholder)
    apply_font(run4, BODY_FONT, size_pt=11, italic=True, color_hex="666666")

    run5 = p.add_run()
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run5._element.append(end)
    return p


def add_toc(doc, title: str, *, hint: str = ""):
    add_heading(doc, title, level=1)
    if hint:
        p = doc.add_paragraph()
        r = p.add_run(hint)
        apply_font(r, BODY_FONT, size_pt=10, italic=True, color_hex="666666")
    _add_field_paragraph(doc, 'TOC \\o "1-3" \\h \\z \\u',
                          "Right-click and Update Field to populate the table of contents.")
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def add_list_of_tables(doc, title: str, *, caption_label: str):
    """caption_label must match the prefix used in table captions (e.g. 'Bảng' or 'Table')."""
    add_heading(doc, title, level=1)
    _add_field_paragraph(doc, f'TOC \\h \\z \\c "{caption_label}"',
                          "Right-click and Update Field to populate the list of tables.")
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def add_list_of_figures(doc, title: str, *, caption_label: str):
    add_heading(doc, title, level=1)
    _add_field_paragraph(doc, f'TOC \\h \\z \\c "{caption_label}"',
                          "Right-click and Update Field to populate the list of figures.")
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def add_acknowledgement(doc, title: str, text: str):
    add_heading(doc, title, level=1)
    if text:
        for para in text.strip().split("\n\n"):
            add_body_paragraph(doc, para)
    else:
        p = doc.add_paragraph()
        r = p.add_run("(Phần này được sinh viên điền sau khi hoàn thành đề tài.)")
        apply_font(r, BODY_FONT, size_pt=11, italic=True, color_hex="888888")
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def add_declaration(doc, title: str, text: str):
    add_heading(doc, title, level=1)
    if text:
        for para in text.strip().split("\n\n"):
            add_body_paragraph(doc, para)
    else:
        # Default declaration text
        default_vi = (
            "Tôi xin cam đoan đây là công trình nghiên cứu của riêng tôi dưới sự "
            "hướng dẫn của giảng viên. Các kết quả nghiên cứu và các kết luận trong "
            "báo cáo này là trung thực, không sao chép từ bất kỳ một nguồn nào và "
            "dưới bất kỳ hình thức nào. Việc tham khảo các nguồn tài liệu (nếu có) "
            "đã được thực hiện trích dẫn và ghi nguồn tài liệu tham khảo đúng quy định."
        )
        add_body_paragraph(doc, default_vi)
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p.paragraph_format.space_before = Pt(24)
        r = p.add_run("Sinh viên thực hiện")
        apply_font(r, BODY_FONT, size_pt=12, italic=True)
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def add_abbreviations(doc, title: str, items, *, table_label: str,
                       caption: str, headers: tuple[str, str]):
    if not items:
        return
    add_heading(doc, title, level=1)
    spec = TableSpec(
        caption=caption,
        headers=list(headers),
        rows=[[a, b] for a, b in items],
        column_widths_cm=[4.0, 11.5],
    )
    add_table_with_caption(doc, spec, f"{table_label} 0.1")
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def add_references(doc, report: Report):
    add_heading(doc, report.references_label, level=1)
    for i, ref in enumerate(report.references, start=1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.8)
        p.paragraph_format.first_line_indent = Cm(-0.8)
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(f"[{i}] {ref}")
        apply_font(r, BODY_FONT, size_pt=11.5)


def emit_section(doc, section: Section, chapter_idx: int, *,
                 table_counter, figure_counter, table_label, figure_label):
    add_heading(doc, section.title, level=section.level)
    for para in section.paragraphs:
        add_body_paragraph(doc, para)
    for bullets in section.bullets:
        add_bullets(doc, bullets)
    for tbl in section.tables:
        table_counter[0] += 1
        add_table_with_caption(doc, tbl, f"{table_label} {chapter_idx}.{table_counter[0]}")
    for fig in section.figures:
        figure_counter[0] += 1
        add_figure_with_caption(doc, fig, f"{figure_label} {chapter_idx}.{figure_counter[0]}")
    for listing in section.listings:
        add_code_listing(doc, listing)
    for child in section.children:
        emit_section(doc, child, chapter_idx,
                     table_counter=table_counter, figure_counter=figure_counter,
                     table_label=table_label, figure_label=figure_label)


def set_page(doc, top=2.5, bottom=2.5, left=3.0, right=2.0):
    for section in doc.sections:
        section.top_margin = Cm(top)
        section.bottom_margin = Cm(bottom)
        section.left_margin = Cm(left)
        section.right_margin = Cm(right)


def apply_global_font(doc):
    # Normal + all heading levels
    apply_font_to_style(doc, "Normal", BODY_FONT, size_pt=12)
    for lvl in (1, 2, 3, 4):
        apply_font_to_style(doc, f"Heading {lvl}", BODY_FONT,
                            size_pt={1: 16, 2: 13, 3: 12, 4: 11}[lvl], bold=True)
    apply_font_to_style(doc, "List Bullet", BODY_FONT, size_pt=12)


# ── Entry point ─────────────────────────────────────────────────────────────

def build(report: Report, output_path: Path) -> Path:
    doc = Document()
    apply_global_font(doc)
    set_page(doc)

    # Front-matter in standard Vietnamese đồ án tốt nghiệp order
    # Hints adapt to the report language by inspecting the table label
    is_vi = report.table_label == "Bảng"
    toc_hint = (
        "(Nhấn chuột phải vào mục lục dưới đây và chọn 'Update Field' / 'Cập nhật trường' để tự sinh.)"
        if is_vi else
        "(Right-click the table of contents below and choose 'Update Field' to populate it.)"
    )
    abbrev_caption = "Danh mục từ viết tắt sử dụng trong báo cáo" if is_vi \
        else "Abbreviations used throughout the report"
    abbrev_headers = ("Viết tắt", "Diễn giải") if is_vi else ("Acronym", "Full form")

    add_cover(doc, report)
    add_declaration(doc, report.declaration_title, report.declaration_text)
    add_acknowledgement(doc, report.acknowledgement_title, report.acknowledgement_text)
    add_abstract(doc, report)
    add_toc(doc, report.toc_label, hint=toc_hint)
    add_list_of_tables(doc, report.list_tables_label, caption_label=report.table_label)
    add_list_of_figures(doc, report.list_figures_label, caption_label=report.figure_label)
    add_abbreviations(doc, report.abbreviations_title, report.abbreviations,
                       table_label=report.table_label,
                       caption=abbrev_caption, headers=abbrev_headers)

    for chapter_idx, chapter in enumerate(report.chapters, start=1):
        table_counter = [0]
        figure_counter = [0]
        emit_section(doc, chapter, chapter_idx,
                     table_counter=table_counter, figure_counter=figure_counter,
                     table_label=report.table_label, figure_label=report.figure_label)
        # Start each next chapter on a new page (skip after the last)
        if chapter_idx < len(report.chapters):
            doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
    add_references(doc, report)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(output_path))
    return output_path
