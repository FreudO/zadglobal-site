from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas


def draw_wrapped_text(c, text, x, y, max_width, font_name="Helvetica", font_size=10, leading=13, color=colors.black):
    c.setFillColor(color)
    c.setFont(font_name, font_size)
    words = text.split()
    line = ""
    for word in words:
        test = f"{line} {word}".strip()
        if pdfmetrics.stringWidth(test, font_name, font_size) <= max_width:
            line = test
        else:
            c.drawString(x, y, line)
            y -= leading
            line = word
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def main():
    out_path = "case-study-insurance-onepager.pdf"
    w, h = A4
    c = canvas.Canvas(out_path, pagesize=A4)

    margin = 14 * mm
    inner_w = w - 2 * margin
    y = h - margin

    # Background
    c.setFillColor(colors.HexColor("#f6f9ff"))
    c.rect(0, 0, w, h, stroke=0, fill=1)

    # Main white page body
    c.setFillColor(colors.white)
    c.rect(margin, margin, inner_w, h - 2 * margin, stroke=0, fill=1)

    # Header block
    head_h = 44 * mm
    c.setFillColor(colors.HexColor("#0b5bd3"))
    c.roundRect(margin + 4, y - head_h, inner_w - 8, head_h, 10, stroke=0, fill=1)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margin + 16, y - 15, "ZAD CASE STUDY")
    c.setFont("Helvetica-Bold", 24)
    c.drawString(margin + 16, y - 34, "Insurance Operations")
    c.setFont("Helvetica", 10)
    subtitle = "AI operating layer for claims intake, agent guidance, new-hire coaching, and manager visibility."
    draw_wrapped_text(c, subtitle, margin + 16, y - 47, inner_w - 120, font_size=10, leading=12, color=colors.white)

    # Badge
    c.setStrokeColor(colors.white)
    c.setLineWidth(1)
    c.roundRect(w - margin - 70 * mm, y - 24, 60 * mm, 16, 8, stroke=1, fill=0)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawCentredString(w - margin - 40 * mm, y - 14, "Practical AI Delivery")

    y -= head_h + 10

    # Metrics row
    metric_w = (inner_w - 20) / 3
    metrics = [("20-50%", "less manual coordination"), ("42", "open cases in cockpit demo"), ("37%", "delays from estimate bottlenecks")]
    x = margin + 4
    for value, label in metrics:
        c.setFillColor(colors.HexColor("#eef4ff"))
        c.setStrokeColor(colors.HexColor("#d9e3f3"))
        c.roundRect(x, y - 38, metric_w, 34, 8, stroke=1, fill=1)
        c.setFillColor(colors.HexColor("#0b5bd3"))
        c.setFont("Helvetica-Bold", 16)
        c.drawString(x + 8, y - 20, value)
        c.setFillColor(colors.HexColor("#2d4568"))
        c.setFont("Helvetica", 8.8)
        c.drawString(x + 8, y - 31, label)
        x += metric_w + 6

    y -= 48

    # Two columns cards
    col_gap = 8
    col_w = (inner_w - 8 - col_gap) / 2
    left_x = margin + 4
    right_x = left_x + col_w + col_gap

    def draw_card(x0, y_top, title, body, bullets):
        c.setFillColor(colors.white)
        c.setStrokeColor(colors.HexColor("#d9e3f3"))
        c.roundRect(x0, y_top - 86, col_w, 82, 8, stroke=1, fill=1)
        c.setFillColor(colors.HexColor("#1f3659"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x0 + 8, y_top - 16, title.upper())
        y_text = draw_wrapped_text(c, body, x0 + 8, y_top - 29, col_w - 16, font_size=8.8, leading=11, color=colors.HexColor("#586a84"))
        c.setFillColor(colors.HexColor("#3b506e"))
        c.setFont("Helvetica", 8.5)
        for b in bullets:
            if y_text < y_top - 76:
                break
            c.drawString(x0 + 10, y_text, f"- {b}")
            y_text -= 10

    draw_card(
        left_x,
        y,
        "Client Situation",
        "The insurer already had claims software, CRM, policy database, email and WhatsApp channels, plus document folders and approvals.",
        ["Scattered evidence", "Inconsistent responses", "Repeated SOP questions", "Low delay visibility"],
    )
    draw_card(
        right_x,
        y,
        "ZAD Layer Added",
        "ZAD sat above existing systems and structured work signals while keeping the claims platform as source of truth.",
        ["AI intake and routing", "Agent response assistant", "In-workflow new-hire coach", "Manager cockpit signals"],
    )

    y -= 94

    # Flow block
    c.setFillColor(colors.white)
    c.setStrokeColor(colors.HexColor("#d9e3f3"))
    c.roundRect(margin + 4, y - 56, inner_w - 8, 52, 8, stroke=1, fill=1)
    c.setFillColor(colors.HexColor("#1f3659"))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin + 12, y - 16, "WORKFLOW TRANSFORMATION")

    flow_y = y - 37
    step_w = 52 * mm
    gap = 8
    sx = margin + 14
    steps = [
        ("Incoming channels", "Email, WhatsApp, forms, PDFs, photos"),
        ("ZAD AI layer", "Extracts, classifies, drafts, flags and routes"),
        ("Existing system", "Claims platform remains source of truth"),
    ]
    for i, (t, b) in enumerate(steps):
        c.setFillColor(colors.HexColor("#f9fbff"))
        c.setStrokeColor(colors.HexColor("#d9e3f3"))
        c.roundRect(sx, flow_y - 16, step_w, 26, 6, stroke=1, fill=1)
        c.setFillColor(colors.HexColor("#607392"))
        c.setFont("Helvetica-Bold", 7.2)
        c.drawString(sx + 5, flow_y + 4, t.upper())
        c.setFillColor(colors.HexColor("#1f3659"))
        c.setFont("Helvetica", 7.6)
        draw_wrapped_text(c, b, sx + 5, flow_y - 4, step_w - 10, font_size=7.6, leading=9, color=colors.HexColor("#1f3659"))
        if i < 2:
            c.setFillColor(colors.HexColor("#7c90af"))
            c.setFont("Helvetica-Bold", 12)
            c.drawString(sx + step_w + 1, flow_y - 3, "->")
        sx += step_w + gap

    y -= 66

    # Bottom cards
    draw_card(
        left_x,
        y,
        "Operational Signal",
        "Repair estimates were the dominant delay driver. Two garages showed slower turnaround than peers.",
        ["Garage A avg delay: 3.8 days", "Garage B avg delay: 2.9 days", "Garage C avg delay: 0.9 days"],
    )
    draw_card(
        right_x,
        y,
        "Recommended Action",
        "Create a fast-estimate lane with auto-reminders after 24h, SLA escalation, and urgent routing to faster partners.",
        ["Faster claims cycle", "Better customer updates", "Clear partner governance"],
    )

    y -= 98

    # Quote section
    c.setFillColor(colors.HexColor("#f3f7ff"))
    c.setStrokeColor(colors.HexColor("#0b5bd3"))
    c.setLineWidth(1)
    c.roundRect(margin + 4, y - 30, inner_w - 8, 26, 6, stroke=1, fill=1)
    c.setFillColor(colors.HexColor("#294260"))
    c.setFont("Helvetica-Bold", 8.7)
    c.drawString(margin + 12, y - 14, "STRATEGIC VALUE:")
    c.setFont("Helvetica", 8.7)
    c.drawString(margin + 86, y - 14, "The AI layer does not just process claims. It reveals choices that reduce delay and improve service.")

    # Footer
    c.setStrokeColor(colors.HexColor("#d9e3f3"))
    c.setLineWidth(0.8)
    c.line(margin + 4, margin + 14, w - margin - 4, margin + 14)
    c.setFillColor(colors.HexColor("#6b7c95"))
    c.setFont("Helvetica", 7.8)
    c.drawString(margin + 6, margin + 6, "Source: ZAD website case studies (Insurance operations)")
    c.drawRightString(w - margin - 6, margin + 6, "© 2026 ZAD Global")

    c.save()


if __name__ == "__main__":
    main()
