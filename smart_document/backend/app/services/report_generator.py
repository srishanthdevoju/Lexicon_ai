import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT

def get_val(obj, attr, default=""):
    """Safely get value from object or dictionary."""
    if isinstance(obj, dict):
        return obj.get(attr, default)
    return getattr(obj, attr, default)

def generate_report(document_id: str, summary, risks, clauses, metadata) -> str:
    """
    Generates a beautifully styled legal PDF report.
    Returns the absolute path to the generated PDF.
    """
    # Define directories
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    reports_dir = os.path.join(base_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)
    report_path = os.path.join(reports_dir, f"{document_id}.pdf")
    
    # Setup document
    doc = SimpleDocTemplate(
        report_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom color palette matching Lexicon AI styling
    primary_color = colors.HexColor('#0F172A')   # Navy / Black
    secondary_color = colors.HexColor('#2563EB') # Blue accent
    text_color = colors.HexColor('#334155')      # Slate body
    
    # Update default body text
    styles['Normal'].textColor = text_color
    styles['Normal'].fontSize = 10
    styles['Normal'].leading = 14
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=primary_color,
        alignment=TA_CENTER,
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#64748B'),
        alignment=TA_CENTER,
        spaceAfter=25
    )
    
    h1_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=13,
        leading=17,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        borderPadding=4,
        borderColor=colors.HexColor('#E2E8F0'),
        borderWidth=0.5,
        borderRadius=2
    )
    
    h2_style = ParagraphStyle(
        'SubSectionHeading',
        parent=styles['Heading3'],
        fontSize=11,
        leading=14,
        textColor=secondary_color,
        spaceBefore=8,
        spaceAfter=4
    )

    bold_label_style = ParagraphStyle(
        'BoldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=primary_color
    )

    story = []
    
    # Cover / Header
    story.append(Paragraph("LEXICONAI | DOCUMENT INTELLIGENCE", title_style))
    story.append(Paragraph("Automated Legal Review & Risk Analysis Audit Report", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Metadata summary table
    parties = get_val(metadata, "parties", [])
    if not isinstance(parties, list):
        parties = [str(parties)]
    parties_str = ", ".join(parties) if parties else "Unspecified Parties"
    
    doc_type = get_val(metadata, "document_type", "Unknown Agreement Type")
    eff_date = get_val(metadata, "effective_date", "Unknown Effective Date")
    
    meta_data = [
        [Paragraph("Document ID", bold_label_style), Paragraph(document_id, styles['Normal'])],
        [Paragraph("Document Type", bold_label_style), Paragraph(str(doc_type), styles['Normal'])],
        [Paragraph("Parties Identified", bold_label_style), Paragraph(parties_str, styles['Normal'])],
        [Paragraph("Effective Date", bold_label_style), Paragraph(str(eff_date), styles['Normal'])],
    ]
    meta_table = Table(meta_data, colWidths=[130, 400])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    # 1. Executive Summary
    story.append(Paragraph("1. Executive Summary", h1_style))
    main_summary = get_val(summary, "main_summary", "No summary available.")
    story.append(Paragraph(str(main_summary), styles['Normal']))
    
    tldr = get_val(summary, "tldr", "")
    if tldr:
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"<b>Quick TLDR:</b> {tldr}", styles['Normal']))
        
    key_points = get_val(summary, "key_points", [])
    if key_points and isinstance(key_points, list):
        story.append(Spacer(1, 6))
        story.append(Paragraph("Key Points Extracted:", h2_style))
        for kp in key_points:
            story.append(Paragraph(f"• {kp}", styles['Normal']))
            
    story.append(Spacer(1, 15))
    
    # 2. Risk Assessment
    story.append(Paragraph("2. Risk Assessment", h1_style))
    
    risk_list = risks if isinstance(risks, list) else []
    
    if risk_list:
        for idx, risk in enumerate(risk_list):
            title = get_val(risk, "title", "Unspecified Risk")
            desc = get_val(risk, "description", "")
            severity = get_val(risk, "severity", "Low")
            
            sev_color = '#DC2626' if str(severity).lower() == 'high' else ('#D97706' if str(severity).lower() == 'medium' else '#16A34A')
            
            risk_header_style = ParagraphStyle(
                f'RiskHeader_{idx}',
                parent=styles['Normal'],
                fontName='Helvetica-Bold',
                textColor=colors.HexColor(sev_color)
            )
            
            story.append(Paragraph(f"{idx+1}. {title} — Severity: {severity.upper()}", risk_header_style))
            story.append(Paragraph(f"<b>Issue Details:</b> {desc}", styles['Normal']))
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("No critical legal risks identified.", styles['Normal']))
        
    story.append(PageBreak())
    
    # 3. Clause Analysis
    story.append(Paragraph("3. Extracted Clauses", h1_style))
    
    std_clauses = get_val(clauses, "standard_clauses", [])
    non_std_clauses = get_val(clauses, "non_standard_clauses", [])
    
    if not std_clauses and not non_std_clauses:
        # Fallback in case clauses is a list rather than standard/non-standard grouped object
        if isinstance(clauses, list):
            non_std_clauses = clauses
        else:
            # Maybe clauses has standard_clauses or non_standard_clauses as dict lists
            pass
            
    # Draw Non-Standard Clauses First
    if non_std_clauses:
        story.append(Paragraph("Non-Standard Clauses (Flags / Warnings):", h2_style))
        for idx, cl in enumerate(non_std_clauses):
            cl_title = get_val(cl, "title", "Unspecified Clause")
            cl_content = get_val(cl, "content", "")
            
            story.append(Paragraph(f"• <b>{cl_title}</b>", styles['Normal']))
            if cl_content:
                excerpt_style = ParagraphStyle(
                    f'ExcerptStyle_N_{idx}',
                    parent=styles['Normal'],
                    fontName='Helvetica-Oblique',
                    textColor=colors.HexColor('#64748B'),
                    leftIndent=15,
                    spaceAfter=4
                )
                story.append(Paragraph(f'"{cl_content}"', excerpt_style))
            story.append(Spacer(1, 4))
            
    if std_clauses:
        story.append(Spacer(1, 8))
        story.append(Paragraph("Standard Clauses:", h2_style))
        for idx, cl in enumerate(std_clauses):
            cl_title = get_val(cl, "title", "Unspecified Clause")
            cl_content = get_val(cl, "content", "")
            
            story.append(Paragraph(f"• <b>{cl_title}</b>", styles['Normal']))
            if cl_content:
                excerpt_style = ParagraphStyle(
                    f'ExcerptStyle_S_{idx}',
                    parent=styles['Normal'],
                    fontName='Helvetica-Oblique',
                    textColor=colors.HexColor('#64748B'),
                    leftIndent=15,
                    spaceAfter=4
                )
                story.append(Paragraph(f'"{cl_content}"', excerpt_style))
            story.append(Spacer(1, 4))
            
    if not std_clauses and not non_std_clauses:
        story.append(Paragraph("No clauses extracted.", styles['Normal']))

    # Canvas callback to draw watermark, header, and footer
    def draw_watermark_and_footer(canvas, doc_obj):
        canvas.saveState()
        
        # 1. Rotated center watermark
        canvas.setFont('Helvetica-Bold', 32)
        canvas.setFillColor(colors.HexColor('#0F172A'), alpha=0.04) # extremely faint primary color
        canvas.translate(300, 400)
        canvas.rotate(45)
        canvas.drawCentredString(0, 20, "Analyzed by LexiconAI")
        canvas.setFont('Helvetica-Bold', 22)
        canvas.drawCentredString(0, -15, "www.lexiconai.com")
        
        canvas.restoreState()
        canvas.saveState()
        
        # 2. Top Header and rule line
        canvas.setFont('Helvetica-Bold', 8)
        canvas.setFillColor(colors.HexColor('#64748B'))
        canvas.drawString(40, 760, "⚖ LexiconAI  |  CONTRACT AUDIT REPORT")
        canvas.setStrokeColor(colors.HexColor('#E2E8F0'))
        canvas.setLineWidth(0.5)
        canvas.line(40, 752, 572, 752)
        
        # 3. Bottom Footer and rule line
        canvas.setFont('Helvetica', 8)
        canvas.drawString(40, 30, "Confidential — Generated by LexiconAI Systems")
        canvas.drawRightString(572, 30, f"Page {doc_obj.page}")
        canvas.line(40, 42, 572, 42)
        
        canvas.restoreState()

    # Build PDF with callbacks
    doc.build(story, onFirstPage=draw_watermark_and_footer, onLaterPages=draw_watermark_and_footer)
    return report_path
