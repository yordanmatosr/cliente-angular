export function formatPhoneNumber(n: string | null | undefined): string {
    if (!n) return '';
    const cleaned = ('' + n).replace(/\D/g, '');
    if (cleaned.length === 11) return cleaned.replace(/^(\d)(\d{3})(\d{3})(\d{4})$/, '$1 ($2) $3-$4');
    if (cleaned.length === 10) return cleaned.replace(/^(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3');
    return cleaned;
}

const SCALE_ROWS = [
    'N/A = No Experience',
    '1 = Limited Experience / Rarely Done',
    '2 = May Need Some Review (1-2 month)',
    '3 = Occasionally (2-3 weekly)',
    '4 = Experienced / Frequently Done (daily and weekly)'
];

function drawHeader(doc: any, orgName: string, reportId: number, logoBase64?: string | null): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(233, 236, 249);
    doc.rect(0, 0, pageWidth, 4.7, 'F');

    let textX = 1.5;
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'JPEG', 1.5, 0.4, 3.5, 2.0);
            textX = 5.5;
        } catch (_) { /* ignore bad logo data */ }
    }

    doc.setFontSize(11).setFont(undefined as any, 'bold');
    doc.text(orgName, textX, 2.0, { maxWidth: 14 });
    doc.setFontSize(11).setFont(undefined as any, 'bold');
    doc.text(`Report ID: ${reportId}`, 1.5, 2.8);

    const dateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.setFontSize(9).setFont(undefined as any, 'normal');
    doc.text(dateStr, pageWidth - 1.5, 2.8, { align: 'right' });
}

function drawSectionTitle(doc: any, title: string, x: number, y: number): number {
    doc.setFontSize(9).setFont(undefined as any, 'bold');
    doc.text(title, x, y, { maxWidth: 8 });
    return y + 0.8;
}

function drawField(doc: any, label: string, value: string, x: number, y: number): number {
    doc.setFontSize(9).setFont(undefined as any, 'bold');
    doc.text(label, x, y, { maxWidth: 3.5 });
    doc.setFont(undefined as any, 'normal');
    doc.text(value || 'N/A', x + 3.8, y, { maxWidth: 5.5 });
    return y + 0.6;
}

function drawSeparator(doc: any, y: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setDrawColor(169, 169, 169).setLineWidth(0.04);
    doc.line(1.5, y, pageWidth - 1.5, y);
    return y + 0.6;
}

export async function buildExamPdfDoc(
    reportData: any,
    incorrectAnswersList: any[],
    logoBase64?: string | null
): Promise<any> {
    const jsPDF = (await import('jspdf')).default;
    const doc = new (jsPDF as any)({ orientation: 'p', unit: 'cm', format: 'a4', compress: true, putOnlyUsedFonts: true });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight() - 1.5;

    const clinician = reportData.userClinician;
    const org = clinician?.department?.organization;
    const exam = reportData.exam;

    drawHeader(doc, org?.organizationName ?? '', reportData.clinicianAssessmentId, logoBase64);

    const x = 1.5;
    const xr = 10.5;
    let y = 5.5;

    let yL = drawSectionTitle(doc, 'CLINICIAN INFORMATION', x, y);
    yL = drawField(doc, 'Name', [clinician?.firstname, clinician?.middlename, clinician?.lastname].filter(Boolean).join(' '), x, yL);
    yL = drawField(doc, 'Specialty', clinician?.specialtyDescription ?? '', x, yL);
    yL = drawField(doc, 'Email', clinician?.email ?? '', x, yL);

    let yR = drawSectionTitle(doc, 'ASSESSMENT INFORMATION', xr, y);
    yR = drawField(doc, 'Date Completed', reportData.dateCompleted ?? '', xr, yR);
    yR = drawField(doc, 'Assessment Name', exam?.examName ?? '', xr, yR);

    y = Math.max(yL, yR) + 0.3;
    y = drawSeparator(doc, y);

    // Score Breakdown
    y = drawSectionTitle(doc, 'SCORE BREAKDOWN', x, y);
    const scoreH = 2.5;
    const centerX = pageWidth / 2;
    const passed = (reportData.groupscore ?? 0) >= (reportData.passingScore ?? 0);

    doc.setFontSize(9).setFont(undefined as any, 'bold');
    doc.text('Tester Score', x + 1.5, y, { align: 'center', maxWidth: 5 });
    doc.setFontSize(22).setFont(undefined as any, 'bold');
    doc.setTextColor(passed ? '#16a34a' : '#dc2626');
    doc.text(`${reportData.groupscore ?? 0}%`, x + 2.5, y + 1.2, { align: 'center' });
    doc.setTextColor('#000000');

    doc.setDrawColor(169, 169, 169).setLineWidth(0.04);
    doc.line(centerX, y - 0.3, centerX, y + scoreH);

    doc.setFontSize(9).setFont(undefined as any, 'bold');
    doc.text('Passing Score', centerX + 2.0, y, { align: 'center', maxWidth: 5 });
    doc.setFontSize(22).setFont(undefined as any, 'bold');
    doc.text(`${reportData.passingScore ?? 0}%`, centerX + 3.0, y + 1.2, { align: 'center' });
    doc.setFontSize(7).setFont(undefined as any, 'normal');
    doc.text('(the recommended minimum score to pass)*', centerX + 3.0, y + 1.8, { align: 'center', maxWidth: 8 });

    y += scoreH + 0.5;
    y = drawSeparator(doc, y);

    // Incorrectly Answered Questions
    if (incorrectAnswersList.length > 0) {
        y = drawSectionTitle(doc, 'Incorrectly Answered Questions', x, y);
        y += 0.3;
        const colW = (pageWidth - 5) / 2;

        doc.setFontSize(9).setFont(undefined as any, 'bold');
        doc.text('Question', x, y, { maxWidth: colW });
        doc.text('Your Response', x + colW + 2, y, { maxWidth: colW });
        y += 0.7;

        for (const q of incorrectAnswersList) {
            if (y >= pageH) { doc.addPage(); y = 2; }
            const lines1 = doc.splitTextToSize(q.question_text ?? '', colW).length;
            const lines2 = doc.splitTextToSize(q.wrong_answer ?? '', colW).length;
            doc.setFontSize(9).setFont(undefined as any, 'normal');
            doc.text(q.question_text ?? '', x, y, { maxWidth: colW });
            doc.setTextColor('#dc2626');
            doc.text(q.wrong_answer ?? '', x + colW + 2, y, { maxWidth: colW });
            doc.setTextColor('#000000');
            y += Math.max(lines1, lines2) * 0.5 + 0.3;
        }
    }

    return doc;
}

export async function buildChecklistPdfDoc(
    checklistRaw: any,
    logoBase64?: string | null
): Promise<any> {
    const jsPDF = (await import('jspdf')).default;
    const doc = new (jsPDF as any)({ orientation: 'p', unit: 'cm', format: 'a4', compress: true, putOnlyUsedFonts: true });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight() - 1.5;

    const rd = checklistRaw.reportData ?? checklistRaw;
    const clinician = rd.userClinician;
    const org = clinician?.department?.organization;
    const exam = rd.exam;
    const questionsList: any[] = checklistRaw.questionsList ?? [];

    drawHeader(doc, org?.organizationName ?? '', rd.clinicianAssessmentId, logoBase64);

    const x = 1.5;
    const xr = 10.5;
    let y = 5.5;

    let yL = drawSectionTitle(doc, 'CLINICIAN INFORMATION', x, y);
    yL = drawField(doc, 'Name', [clinician?.firstname, clinician?.middlename, clinician?.lastname].filter(Boolean).join(' '), x, yL);
    yL = drawField(doc, 'Email', clinician?.email ?? '', x, yL);

    let yR = drawSectionTitle(doc, 'ASSESSMENT INFORMATION', xr, y);
    yR = drawField(doc, 'Date Completed', rd.dateCompleted ?? '', xr, yR);
    yR = drawField(doc, 'Assessment Name', exam?.examName ?? '', xr, yR);

    y = Math.max(yL, yR) + 0.3;
    y = drawSeparator(doc, y);

    // Score
    const combined = ((rd.proficiency ?? 0) + (rd.frequency ?? 0)) / 2;
    y = drawSectionTitle(doc, 'SCORE', x, y);
    doc.setFontSize(9).setFont(undefined as any, 'bold');
    doc.text('Proficiency:', x, y);
    doc.setFont(undefined as any, 'normal');
    doc.text(String(rd.proficiency ?? 0), x + 2.8, y);
    doc.setFont(undefined as any, 'bold');
    doc.text('Frequency:', x + 5, y);
    doc.setFont(undefined as any, 'normal');
    doc.text(String(rd.frequency ?? 0), x + 7.8, y);
    doc.setFont(undefined as any, 'bold');
    doc.text('Combined:', x + 10, y);
    doc.setFont(undefined as any, 'normal');
    doc.text(`${combined.toFixed(2)} / 4.00`, x + 12.8, y);
    y += 0.9;
    y = drawSeparator(doc, y);

    // Scale
    y = drawSectionTitle(doc, 'SCALE', x, y);
    doc.setFontSize(9).setFont(undefined as any, 'bold');
    doc.text('PROFICIENCY EXPERIENCE', x, y, { maxWidth: 9 });
    doc.text('FREQUENCY EXPERIENCE', xr, y, { maxWidth: 9 });
    y += 0.8;
    for (const s of SCALE_ROWS) {
        if (y >= pageH) { doc.addPage(); y = 2; }
        doc.setFontSize(9).setFont(undefined as any, 'normal');
        doc.text(s, x, y, { maxWidth: 8 });
        doc.text(s, xr, y, { maxWidth: 8 });
        y += 0.5;
    }
    y += 0.3;

    // Summary
    if (questionsList.length > 0) {
        doc.addPage();
        y = 2;
        y = drawSectionTitle(doc, 'SUMMARY', x, y);
        y += 0.3;

        doc.setFontSize(9).setFont(undefined as any, 'bold');
        doc.text('TYPE', x, y, { maxWidth: 10 });
        doc.text('PROFICIENCY', x + 14, y, { maxWidth: 4, align: 'right' });
        doc.text('FREQUENCY', pageWidth - 1.5, y, { maxWidth: 4, align: 'right' });
        y += 0.8;

        for (const q of questionsList) {
            if (y >= pageH) { doc.addPage(); y = 2; }
            doc.setFontSize(9).setFont(undefined as any, 'bold');
            doc.text(q.examName ?? '', x, y, { maxWidth: 11 });
            doc.setFont(undefined as any, 'normal');
            doc.text(String(q.proficiency ?? ''), x + 14, y, { maxWidth: 3, align: 'right' });
            doc.text(String(q.frequency ?? ''), pageWidth - 1.5, y, { maxWidth: 3, align: 'right' });
            y += 0.6;

            for (const a of (q.answersList ?? [])) {
                if (y >= pageH) { doc.addPage(); y = 2; }
                doc.setFontSize(9).setFont(undefined as any, 'normal');
                doc.text(a.question ?? '', x + 1, y, { maxWidth: 10 });
                doc.text(String(a.proficiency ?? ''), x + 14, y, { maxWidth: 3, align: 'right' });
                doc.text(String(a.frequency ?? ''), pageWidth - 1.5, y, { maxWidth: 3, align: 'right' });
                y += 0.5;
            }
            y += 0.2;
        }
    }

    return doc;
}
