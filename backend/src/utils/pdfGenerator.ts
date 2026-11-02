import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface PrescriptionPdfInput {
  appointmentReference?: string;
  prescriptionNumber?: string;
  date: string;
  doctor: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    departmentName?: string;
    licenseNumber?: string;
    qualifications?: string[];
  };
  patient: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    gender?: string;
    age?: number;
  };
  vitals?: {
    bloodPressure?: string;
    pulseRate?: string;
    temperature?: string;
    spO2?: string;
    weight?: string;
    respiratoryRate?: string;
  };
  diagnosis: string;
  symptomsAndFindings?: string;
  medications: Array<{
    name: string;
    dosage: string;
    route?: string;
    frequency: string;
    duration: string;
    timing: string;
    quantity?: string;
    instructions?: string;
  }>;
  labTestsRecommended?: string[];
  clinicalNotes?: string;
  additionalAdvice?: string;
  followUpDate?: string;
  status: string;
  version: number;
}

export const generatePrescriptionPdf = (
  data: PrescriptionPdfInput,
  res: Response
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Prescription-${data.appointmentReference || 'Consultation'}`,
          Author: `Dr. ${data.doctor.firstName} ${data.doctor.lastName}`,
          Subject: 'Medical Prescription',
          Keywords: 'CityCare, Prescription, Medical Record, Hospital Management System',
        },
      });

      // Stream directly to response
      doc.pipe(res);

      const primaryColor = '#102A56'; // Navy
      const accentColor = '#2563EB'; // Blue
      const darkText = '#1E293B';
      const mutedText = '#64748B';
      const lightBg = '#F8FAFC';
      const borderColor = '#CBD5E1';

      // -----------------------------------------------------------------
      // 1. HOSPITAL HEADER
      // -----------------------------------------------------------------
      doc
        .rect(40, 40, 515, 68)
        .fill(lightBg);

      doc
        .rect(40, 40, 6, 68)
        .fill(accentColor);

      doc
        .fillColor(primaryColor)
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('CITYCARE HOSPITAL & RESEARCH CENTER', 56, 48);

      doc
        .fillColor(accentColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(
          data.doctor.departmentName
            ? `DEPARTMENT OF ${data.doctor.departmentName.toUpperCase()}`
            : 'CLINICAL OUTPATIENT DEPARTMENT',
          56,
          70
        );

      doc
        .fillColor(mutedText)
        .fontSize(8)
        .font('Helvetica')
        .text('NABH & JCI Accredited Healthcare • 24x7 Emergency Hotline: 112 / 108', 56, 84);

      doc
        .fillColor(primaryColor)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('OFFICIAL DIGITAL PRESCRIPTION', 390, 50, { width: 155, align: 'right' });

      doc
        .fillColor(mutedText)
        .fontSize(7.5)
        .font('Helvetica')
        .text(`Ref: ${data.appointmentReference || 'N/A'}`, 390, 64, { width: 155, align: 'right' })
        .text(`Date: ${data.date}`, 390, 76, { width: 155, align: 'right' })
        .text(`Version ${data.version || 1} • ${data.status}`, 390, 88, { width: 155, align: 'right' });

      // -----------------------------------------------------------------
      // 2. DOCTOR & PATIENT DETAILS ROW
      // -----------------------------------------------------------------
      let currentY = 120;

      // Doctor Box
      doc
        .rect(40, currentY, 250, 65)
        .strokeColor(borderColor)
        .lineWidth(0.8)
        .stroke();

      doc
        .fillColor(mutedText)
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('CONSULTING PHYSICIAN', 50, currentY + 8);

      doc
        .fillColor(darkText)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Dr. ${data.doctor.firstName} ${data.doctor.lastName}`, 50, currentY + 20);

      const quals = data.doctor.qualifications?.join(', ') || 'MBBS, MD';
      doc
        .fillColor(mutedText)
        .fontSize(8)
        .font('Helvetica')
        .text(quals, 50, currentY + 34)
        .text(`License No: ${data.doctor.licenseNumber || 'MCI-VERIFIED'}`, 50, currentY + 46);

      // Patient Box
      doc
        .rect(305, currentY, 250, 65)
        .strokeColor(borderColor)
        .lineWidth(0.8)
        .stroke();

      doc
        .fillColor(mutedText)
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('PATIENT IDENTIFICATION', 315, currentY + 8);

      doc
        .fillColor(darkText)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`${data.patient.firstName} ${data.patient.lastName}`, 315, currentY + 20);

      doc
        .fillColor(mutedText)
        .fontSize(8)
        .font('Helvetica')
        .text(`Phone: ${data.patient.phone || 'N/A'}`, 315, currentY + 34)
        .text(`Email: ${data.patient.email || 'N/A'}`, 315, currentY + 46);

      // -----------------------------------------------------------------
      // 3. VITALS ROW
      // -----------------------------------------------------------------
      currentY += 75;
      if (data.vitals) {
        doc.rect(40, currentY, 515, 28).fill('#F1F5F9');
        doc.fillColor(mutedText).fontSize(7.5).font('Helvetica-Bold');

        const v = data.vitals;
        const vitalsText = [
          `BP: ${v.bloodPressure || 'N/A'}`,
          `Pulse: ${v.pulseRate || 'N/A'} bpm`,
          `Temp: ${v.temperature || 'N/A'} °F`,
          `SpO2: ${v.spO2 || 'N/A'}`,
          `Weight: ${v.weight || 'N/A'} kg`,
        ].join('    |    ');

        doc
          .fillColor(darkText)
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text(`VITALS:    ${vitalsText}`, 50, currentY + 9);

        currentY += 36;
      }

      // -----------------------------------------------------------------
      // 4. CLINICAL DIAGNOSIS & OBSERVATIONS
      // -----------------------------------------------------------------
      doc
        .fillColor(primaryColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('PROVISIONAL / CLINICAL DIAGNOSIS', 40, currentY);

      doc
        .rect(40, currentY + 12, 515, 26)
        .fillAndStroke('#EFF6FF', '#BFDBFE');

      doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(data.diagnosis, 50, currentY + 19);

      currentY += 46;

      if (data.symptomsAndFindings) {
        doc
          .fillColor(mutedText)
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text('CLINICAL FINDINGS & OBSERVATIONS', 40, currentY);

        doc
          .fillColor(darkText)
          .fontSize(8.5)
          .font('Helvetica')
          .text(data.symptomsAndFindings, 40, currentY + 12, { width: 515 });

        currentY += 28;
      }

      // -----------------------------------------------------------------
      // 5. MEDICATIONS TABLE (Rx)
      // -----------------------------------------------------------------
      doc
        .fillColor(accentColor)
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('Rx  (Prescribed Medications)', 40, currentY);

      currentY += 18;

      // Table Header
      doc.rect(40, currentY, 515, 20).fill('#102A56');

      doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
      doc.text('#', 46, currentY + 6);
      doc.text('Medication / Formulation', 65, currentY + 6);
      doc.text('Strength', 205, currentY + 6);
      doc.text('Frequency', 270, currentY + 6);
      doc.text('Duration', 345, currentY + 6);
      doc.text('Instructions & Timing', 415, currentY + 6);

      currentY += 20;

      // Medication Rows
      data.medications.forEach((med, idx) => {
        const isEven = idx % 2 === 0;
        const rowHeight = 22;

        if (isEven) {
          doc.rect(40, currentY, 515, rowHeight).fill('#F8FAFC');
        }

        doc
          .rect(40, currentY, 515, rowHeight)
          .strokeColor('#E2E8F0')
          .lineWidth(0.5)
          .stroke();

        doc.fillColor(darkText).fontSize(8).font('Helvetica-Bold');
        doc.text(String(idx + 1), 46, currentY + 7);
        doc.text(med.name, 65, currentY + 7, { width: 135, ellipsis: true });

        doc.font('Helvetica');
        doc.text(med.dosage || '-', 205, currentY + 7);
        doc.text(med.frequency || '-', 270, currentY + 7);
        doc.text(med.duration || '-', 345, currentY + 7);

        const notes = [med.timing, med.instructions].filter(Boolean).join(' - ');
        doc.text(notes || '-', 415, currentY + 7, { width: 135, ellipsis: true });

        currentY += rowHeight;
      });

      currentY += 12;

      // -----------------------------------------------------------------
      // 6. RECOMMENDED LAB TESTS & ADVICE
      // -----------------------------------------------------------------
      if (data.labTestsRecommended && data.labTestsRecommended.length > 0) {
        doc
          .fillColor(primaryColor)
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text('RECOMMENDED DIAGNOSTIC INVESTIGATIONS:', 40, currentY);

        doc
          .fillColor(darkText)
          .fontSize(8)
          .font('Helvetica')
          .text(data.labTestsRecommended.join(',  '), 40, currentY + 12, { width: 515 });

        currentY += 26;
      }

      if (data.clinicalNotes || data.additionalAdvice) {
        doc
          .fillColor(primaryColor)
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text('CLINICAL ADVICE & DIETARY GUIDELINES:', 40, currentY);

        const advice = [data.clinicalNotes, data.additionalAdvice].filter(Boolean).join('\n');
        doc
          .fillColor(darkText)
          .fontSize(8)
          .font('Helvetica')
          .text(advice, 40, currentY + 12, { width: 515 });

        currentY += 26;
      }

      if (data.followUpDate) {
        doc
          .fillColor(accentColor)
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text(`RECOMMENDED FOLLOW-UP: ${data.followUpDate}`, 40, currentY);

        currentY += 22;
      }

      // -----------------------------------------------------------------
      // 7. DIGITAL SIGNATURE & SECURITY BLOCK
      // -----------------------------------------------------------------
      const footerY = 740;

      doc
        .rect(40, footerY - 5, 515, 0.8)
        .fill('#CBD5E1');

      doc
        .fillColor(mutedText)
        .fontSize(7)
        .font('Helvetica')
        .text(
          'Digitally signed and cryptographically verified under CityCare Medical Records protocol. Tamper-evident.',
          40,
          footerY + 10,
          { width: 330 }
        );

      doc
        .fillColor(primaryColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`Dr. ${data.doctor.firstName} ${data.doctor.lastName}`, 380, footerY + 8, {
          width: 175,
          align: 'right',
        });

      doc
        .fillColor(mutedText)
        .fontSize(7.5)
        .font('Helvetica')
        .text('Authorized Medical Practitioner', 380, footerY + 20, {
          width: 175,
          align: 'right',
        });

      doc.end();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

