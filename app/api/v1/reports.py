
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.report import SecurityReportResponse
from app.services.report_service import ReportService
from fastapi.responses import Response
from io import BytesIO
from xml.sax.saxutils import escape
from app.core.dependencies import get_current_user
from fastapi.responses import Response

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

router = APIRouter(
    prefix="/reports",
    tags=["Security Reports"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/{batch_id}",
    response_model=SecurityReportResponse,
)
async def get_security_report(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ReportService()

    try:
        report = await service.generate_report(
            batch_id=batch_id,
            db=db,
        )

        return report

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

@router.get("/{batch_id}/export/json")
async def export_security_report_json(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ReportService()

    try:
        report = await service.generate_report(
            batch_id=batch_id,
            db=db,
        )

        json_content = report.model_dump_json(indent=2)

        return Response(
            content=json_content,
            media_type="application/json",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="security_report_{batch_id}.json"'
                )
            },
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

@router.get("/{batch_id}/export/pdf")
async def export_security_report_pdf(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ReportService()

    try:
        report = await service.generate_report(
            batch_id=batch_id,
            db=db,
        )

        buffer = BytesIO()

        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=18 * mm,
            leftMargin=18 * mm,
            topMargin=18 * mm,
            bottomMargin=18 * mm,
            title="AI Security Assessment Report",
        )

        styles = getSampleStyleSheet()

        styles.add(ParagraphStyle(
            name="ReportTitle",
            parent=styles["Title"],
            fontSize=22,
            leading=28,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#17365D"),
            spaceAfter=12,
        ))

        styles.add(ParagraphStyle(
            name="SectionHeading",
            parent=styles["Heading2"],
            textColor=colors.HexColor("#17365D"),
            spaceBefore=14,
            spaceAfter=8,
        ))

        styles.add(ParagraphStyle(
            name="SmallText",
            parent=styles["BodyText"],
            fontSize=8,
            leading=11,
        ))

        story = []

        # Report title
        story.append(Paragraph(
            "AI SECURITY ASSESSMENT REPORT",
            styles["ReportTitle"],
        ))

        story.append(Paragraph(
            "Automated AI Red-Team Testing Results",
            styles["Heading2"],
        ))

        story.append(Spacer(1, 12))

        # Target information
        story.append(Paragraph(
            "1. Target Information",
            styles["SectionHeading"],
        ))

        target_data = [
            ["Target", escape(report.target_name)],
            ["Provider", escape(report.provider)],
            ["Model", escape(report.model_id)],
            ["Target ID", str(report.target_id)],
            ["Batch ID", escape(report.batch_id)],
            ["Generated At", report.generated_at.isoformat()],
        ]

        target_table = Table(
            target_data,
            colWidths=[40 * mm, 125 * mm],
        )

        target_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1),
             colors.HexColor("#E8EEF7")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("PADDING", (0, 0), (-1, -1), 7),
        ]))

        story.append(target_table)

        # Executive summary
        story.append(Paragraph(
            "2. Executive Summary",
            styles["SectionHeading"],
        ))

        summary = report.summary

        summary_data = [
            ["Metric", "Result"],
            ["Total Tests", str(summary.total_tests)],
            ["Evaluated", str(summary.evaluated)],
            ["Unevaluated", str(summary.unevaluated)],
            ["Passed", str(summary.passed)],
            ["Failed", str(summary.failed)],
            ["Inconclusive", str(summary.inconclusive)],
            ["Evaluation Coverage",
             f"{summary.evaluation_coverage}%"],
            ["Conclusive Coverage",
             f"{summary.conclusive_coverage}%"],
        ]

        summary_table = Table(
            summary_data,
            colWidths=[85 * mm, 80 * mm],
        )

        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0),
             colors.HexColor("#17365D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("PADDING", (0, 0), (-1, -1), 7),
        ]))

        story.append(summary_table)

        # Risk assessment
        story.append(Paragraph(
            "3. Risk Assessment",
            styles["SectionHeading"],
        ))

        risk = report.risk_assessment

        risk_data = [
            ["Metric", "Result"],
            [
                "Overall Risk Score",
                str(risk.overall_score)
                if risk.overall_score is not None
                else "Not rated",
            ],
            ["Risk Classification", risk.risk_classification.upper()],
        ]

        for severity, count in risk.severity_distribution.items():
            risk_data.append([severity.title(), str(count)])

        risk_table = Table(
            risk_data,
            colWidths=[85 * mm, 80 * mm],
        )

        risk_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0),
             colors.HexColor("#17365D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("PADDING", (0, 0), (-1, -1), 7),
        ]))

        story.append(risk_table)

        # Detailed findings
        story.append(Paragraph(
            "4. Detailed Security Findings",
            styles["SectionHeading"],
        ))

        for index, finding in enumerate(report.findings, start=1):

            story.append(Paragraph(
                f"Finding {index}: {escape(finding.test_name)}",
                styles["Heading3"],
            ))

            finding_data = [
                ["Field", "Value"],
                ["Execution ID", str(finding.execution_result_id)],
                ["Attack Category", escape(finding.attack_category)],
                ["Test Severity", escape(finding.test_severity)],
                ["Execution Status", escape(finding.execution_status)],
                ["Verdict", escape(finding.verdict or "Not evaluated")],
                ["Risk Level", escape(finding.risk_level or "Not evaluated")],
                [
                    "Explanation",
                    Paragraph(
                        escape(finding.explanation or "Not available"),
                        styles["SmallText"],
                    ),
                ],
                [
                    "Matched Indicators",
                    Paragraph(
                        "<br/>".join(
                            escape(item)
                            for item in finding.matched_indicators
                        ) or "None",
                        styles["SmallText"],
                    ),
                ],
                [
                    "Model Response",
                    Paragraph(
                        escape(finding.model_response or "No response"),
                        styles["SmallText"],
                    ),
                ],
            ]

            finding_table = Table(
                finding_data,
                colWidths=[40 * mm, 125 * mm],
            )

            finding_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0),
                 colors.HexColor("#E8EEF7")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 7),
            ]))

            story.append(finding_table)
            story.append(Spacer(1, 12))

        # Footer with page numbers
        def add_page_number(canvas, doc):
            canvas.saveState()
            canvas.setFont("Helvetica", 8)
            canvas.drawString(
                18 * mm,
                10 * mm,
                "AI Red-Team Security Assessment",
            )
            canvas.drawRightString(
                A4[0] - 18 * mm,
                10 * mm,
                f"Page {doc.page}",
            )
            canvas.restoreState()

        document.build(
            story,
            onFirstPage=add_page_number,
            onLaterPages=add_page_number,
        )

        pdf_content = buffer.getvalue()
        buffer.close()

        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="security_report_{batch_id}.pdf"'
                )
            },
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

