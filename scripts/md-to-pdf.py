#!/usr/bin/env python
"""Lightweight Markdown -> PDF converter (reportlab).

Handles the Markdown subset used in docs/launch-research-2026: H1/H2/H3,
paragraphs with **bold** / *italic* / `code` / [links], bullet & numbered
lists, GitHub tables, and --- rules. Styled with Dinaya brand colours.

Usage: python scripts/md-to-pdf.py <input.md> <output.pdf>
"""
import sys
import re
import html

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether,
)

# --- Dinaya brand palette (Cobalt / Violet / Amber / Green — no pink/rose) ---
COBALT = colors.HexColor("#2563EB")
COBALT_DK = colors.HexColor("#1E3A8A")
SLATE = colors.HexColor("#0F172A")
GREY = colors.HexColor("#475569")
VIOLET = colors.HexColor("#7C3AED")
BORDER = colors.HexColor("#E2E8F0")
HEAD_BG = colors.HexColor("#1E3A8A")
ROW_ALT = colors.HexColor("#F8FAFC")

TITLE = ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=21, leading=25,
                       textColor=COBALT_DK, spaceAfter=2)
SUBTITLE = ParagraphStyle("subtitle", fontName="Helvetica-Oblique", fontSize=10,
                          leading=14, textColor=GREY, spaceAfter=8)
H2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=14.5, leading=18,
                    textColor=COBALT, spaceBefore=16, spaceAfter=4)
H3 = ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=11.5, leading=15,
                    textColor=SLATE, spaceBefore=9, spaceAfter=2)
BODY = ParagraphStyle("body", fontName="Helvetica", fontSize=10, leading=14.5,
                      textColor=SLATE, spaceAfter=5)
BULLET = ParagraphStyle("bullet", parent=BODY, leftIndent=14, bulletIndent=2, spaceAfter=3)
CELL = ParagraphStyle("cell", fontName="Helvetica", fontSize=8.6, leading=11.5, textColor=SLATE)
CELL_H = ParagraphStyle("cellh", fontName="Helvetica-Bold", fontSize=8.8, leading=11.5,
                        textColor=colors.white)
CODE_BLOCK = ParagraphStyle("codeblock", fontName="Courier", fontSize=8.5, leading=12.5,
                            textColor=SLATE)

SANITIZE = {"→": "-&gt;", "≥": "&gt;=", "≤": "&lt;=", "≈": "~",
            "≠": "!="}


def inline(text):
    """Markdown inline -> reportlab mini-HTML."""
    text = html.escape(text, quote=False)
    for a, b in SANITIZE.items():
        text = text.replace(a, b)
    codes = []
    text = re.sub(r"`([^`]+)`", lambda m: codes.append(m.group(1)) or f"\x00{len(codes)-1}\x00", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", lambda m: f'<font color="#2563EB">{m.group(1)}</font>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<i>\1</i>", text)
    text = re.sub(r"\x00(\d+)\x00",
                  lambda m: f'<font face="Courier" size="8.6" color="#7C3AED">{codes[int(m.group(1))]}</font>',
                  text)
    return text


def is_table_sep(line):
    return bool(re.match(r"^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$", line)) and "-" in line


def split_row(line):
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [c.strip() for c in line.split("|")]


def build(md_path, pdf_path):
    with open(md_path, encoding="utf-8") as f:
        lines = f.read().split("\n")

    flow = []
    content_w = A4[0] - 36 * mm
    i, n = 0, len(lines)
    first_h1_done = False

    while i < n:
        line = lines[i]
        if not line.strip():
            i += 1
            continue

        # Fenced code block
        if line.strip().startswith("```"):
            i += 1
            code_lines = []
            while i < n and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            i += 1  # closing fence
            esc = []
            for c in code_lines:
                c = html.escape(c, quote=False).replace(" ", "&nbsp;")
                for a, b in SANITIZE.items():
                    c = c.replace(a, b)
                esc.append(c)
            cb = Table([[Paragraph("<br/>".join(esc), CODE_BLOCK)]], colWidths=[content_w])
            cb.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))
            flow.append(Spacer(1, 2))
            flow.append(cb)
            flow.append(Spacer(1, 6))
            continue

        # Table
        if line.lstrip().startswith("|") and i + 1 < n and is_table_sep(lines[i + 1]):
            header = split_row(line)
            rows = []
            i += 2
            while i < n and lines[i].lstrip().startswith("|"):
                rows.append(split_row(lines[i]))
                i += 1
            ncol = len(header)
            data = [[Paragraph(inline(c), CELL_H) for c in header]]
            for r in rows:
                r = (r + [""] * ncol)[:ncol]
                data.append([Paragraph(inline(c), CELL) for c in r])
            col_w = [content_w / ncol] * ncol
            t = Table(data, colWidths=col_w, repeatRows=1)
            style = [
                ("BACKGROUND", (0, 0), (-1, 0), HEAD_BG),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
            for ri in range(1, len(data)):
                if ri % 2 == 0:
                    style.append(("BACKGROUND", (0, ri), (-1, ri), ROW_ALT))
            t.setStyle(TableStyle(style))
            flow.append(Spacer(1, 4))
            flow.append(t)
            flow.append(Spacer(1, 6))
            continue

        if line.startswith("### "):
            flow.append(Paragraph(inline(line[4:]), H3))
        elif line.startswith("## "):
            flow.append(Paragraph(inline(line[3:]), H2))
            flow.append(HRFlowable(width="100%", thickness=0.6, color=BORDER,
                                   spaceBefore=1, spaceAfter=4))
        elif line.startswith("# "):
            flow.append(Paragraph(inline(line[2:]), TITLE))
            first_h1_done = True
        elif re.match(r"^\s*---\s*$", line):
            flow.append(HRFlowable(width="100%", thickness=0.8, color=BORDER,
                                   spaceBefore=6, spaceAfter=6))
        elif re.match(r"^\s*[-*] ", line):
            txt = re.sub(r"^\s*[-*] ", "", line)
            flow.append(Paragraph(inline(txt), BULLET, bulletText="•"))
        elif re.match(r"^\s*\d+\. ", line):
            m = re.match(r"^\s*(\d+)\. (.*)", line)
            flow.append(Paragraph(inline(m.group(2)), BULLET, bulletText=f"{m.group(1)}."))
        else:
            style = SUBTITLE if (first_h1_done and line.strip().startswith("*") and not flow_has_body(flow)) else BODY
            flow.append(Paragraph(inline(line), style))
        i += 1

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(GREY)
        canvas.drawString(18 * mm, 10 * mm, "Dinaya · Ardeno Studio — First 100 Customers Action Plan")
        canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Page {doc.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(pdf_path, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                            topMargin=16 * mm, bottomMargin=16 * mm,
                            title="Dinaya — First 100 Customers Action Plan", author="Ardeno Studio")
    doc.build(flow, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {pdf_path}")


# subtitle only applies to the first italic line right after the H1
def flow_has_body(flow):
    return any(getattr(f, "style", None) is BODY for f in flow)


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
