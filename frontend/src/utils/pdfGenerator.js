import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import api from './api';

// Helper to fetch school details from database
const getSchoolDetails = async () => {
  try {
    const res = await api.get('/school');
    if (res.data.success) {
      return res.data.data;
    }
  } catch (err) {
    console.error('Error fetching school details for PDF:', err);
  }
  return null;
};

// Helper to load image asynchronously inside jsPDF
const loadImage = (url) => new Promise((resolve) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = url;
});

// Utility to download a beautiful fee receipt PDF
export const downloadFeeReceipt = async (fee) => {
  const school = await getSchoolDetails();
  const schoolName = school?.name || 'EDUTRACK ACADEMY';
  const schoolAddress = school?.address || '100 School Lane, Education Heights';
  const schoolPhone = school?.phone || '';
  const schoolEmail = school?.email || 'support@edutrack.com';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const studentName = fee.student?.user?.name || 'N/A';
  const rollNumber = fee.student?.rollNumber || 'N/A';
  const className = fee.student?.classId ? `${fee.student.classId.className}-${fee.student.classId.section}` : 'N/A';

  // Branding Banner
  doc.setFillColor(31, 41, 55); // Slate 800
  doc.rect(0, 0, 210, 40, 'F');

  // Load and Add Logo if exists
  const logoUrl = school && school.logo
    ? (school.logo.startsWith('data:') || school.logo.startsWith('http') ? school.logo : `http://localhost:5000${school.logo}`)
    : '';

  let textX = 14;
  if (logoUrl) {
    const img = await loadImage(logoUrl);
    if (img) {
      doc.setFillColor(255, 255, 255);
      doc.rect(14, 8, 24, 24, 'F'); // Background card
      doc.addImage(img, 'PNG', 15, 9, 22, 22);
      textX = 44;
    }
  }

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(schoolName.toUpperCase(), textX, 17);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  const contactText = `${schoolAddress}${schoolPhone ? ' | Tel: ' + schoolPhone : ''} | Email: ${schoolEmail}`;
  const contactLines = doc.splitTextToSize(contactText, 200 - textX);
  doc.text(contactLines, textX, 23);
  doc.setFontSize(10);
  doc.text('OFFICIAL PAYMENT RECEIPT', textX, 33);

  // Receipt Meta Box
  doc.setTextColor(55, 65, 81);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RECEIPT DETAILS', 14, 52);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Receipt Number:   ${fee.receiptNo || 'N/A'}`, 14, 60);
  doc.text(`Payment Date:     ${fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString() : 'N/A'}`, 14, 66);
  doc.text(`Billing Status:   ${fee.status}`, 14, 72);

  // Student Details Box
  doc.setFont('Helvetica', 'bold');
  doc.text('BILL TO (STUDENT)', 120, 52);
  
  doc.setFont('Helvetica', 'normal');
  doc.text(`Name:             ${studentName}`, 120, 60);
  doc.text(`Roll Number:      ${rollNumber}`, 120, 66);
  doc.text(`Class/Section:    ${className}`, 120, 72);

  // Divider Line
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 80, 196, 80);

  // Invoice Table
  doc.autoTable({
    startY: 88,
    head: [['Item Description', 'Fee Type', 'Due Date', 'Total Paid']],
    body: [
      [
        `Academic tuition fee invoice. Period: ${new Date(fee.dueDate).toLocaleDateString('default', { month: 'long', year: 'numeric' })}`,
        fee.feeType || 'Tuition Fee',
        new Date(fee.dueDate).toLocaleDateString(),
        `$${fee.amount.toFixed(2)}`
      ]
    ],
    theme: 'striped',
    headStyles: { fillColor: [55, 65, 81] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 32, halign: 'right' }
    }
  });

  // Total Summary Panel
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFillColor(243, 244, 246);
  doc.rect(120, finalY, 76, 25, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total Amount Paid:', 125, finalY + 10);
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129); // Emerald-500
  doc.text(`$${fee.amount.toFixed(2)}`, 125, finalY + 18);

  // Signature lines
  doc.setTextColor(107, 114, 128);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for your prompt payment.', 14, finalY + 35);
  doc.text('This is a computer generated document, no signature is required.', 14, finalY + 39);

  doc.save(`Receipt-${fee.receiptNo || 'Fee'}.pdf`);
};

// Utility to download a beautiful student report card / grades transcript
export const downloadStudentReportCard = async (studentName, rollNumber, className, examData) => {
  const school = await getSchoolDetails();
  const schoolName = school?.name || 'EDUTRACK ACADEMY';
  const schoolAddress = school?.address || '100 School Lane, Education Heights';
  const schoolPhone = school?.phone || '';
  const schoolEmail = school?.email || 'support@edutrack.com';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Branding Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 210, 45, 'F');

  // Load and Add Logo if exists
  const logoUrl = school && school.logo
    ? (school.logo.startsWith('data:') || school.logo.startsWith('http') ? school.logo : `http://localhost:5000${school.logo}`)
    : '';

  let textX = 14;
  if (logoUrl) {
    const img = await loadImage(logoUrl);
    if (img) {
      doc.setFillColor(255, 255, 255);
      doc.rect(14, 10, 25, 25, 'F');
      doc.addImage(img, 'PNG', 16, 11, 21, 21);
      textX = 46;
    }
  }

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(schoolName.toUpperCase(), textX, 19);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  const contactText = `${schoolAddress}${schoolPhone ? ' | Tel: ' + schoolPhone : ''} | Email: ${schoolEmail}`;
  const contactLines = doc.splitTextToSize(contactText, 200 - textX);
  doc.text(contactLines, textX, 25);
  doc.setFontSize(10);
  doc.text(`Exam Term: ${examData.examType} - Progress Report & Transcript`, textX, 35);

  // Student Details Panel
  doc.setTextColor(55, 65, 81);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('STUDENT INFORMATION', 14, 58);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Student Name:     ${studentName}`, 14, 66);
  doc.text(`Roll Number:      ${rollNumber}`, 14, 72);
  doc.text(`Class & Section:  ${className}`, 14, 78);

  doc.setFont('Helvetica', 'bold');
  doc.text('ACADEMIC METRICS', 120, 58);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Overall Percentage:  ${examData.percentage || 'N/A'}%`, 120, 66);
  doc.text(`Overall Letter Grade: ${examData.overallGrade || 'N/A'}`, 120, 72);
  doc.text(`Status:              PROMOTED`, 120, 78);

  // Divider Line
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 84, 196, 84);

  // Marks Table
  const tableRows = examData.subjects.map(sub => [
    sub.subject,
    sub.marksObtained,
    sub.totalMarks,
    `${((sub.marksObtained / sub.totalMarks) * 100).toFixed(0)}%`,
    sub.grade,
    sub.teacher
  ]);

  doc.autoTable({
    startY: 92,
    head: [['Subject Name', 'Marks Obtained', 'Total Marks', 'Percentage', 'Letter Grade', 'Assigned Teacher']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 31 }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 15;

  // Grade Boundaries Helper Box
  doc.setFillColor(249, 250, 251);
  doc.rect(14, finalY, 182, 18, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('GRADE BOUNDARIES:', 18, finalY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.text('A+ (>=90%)   |   A (80-89%)   |   B (70-79%)   |   C (60-69%)   |   D (50-59%)   |   F (Below 50%)', 18, finalY + 12);

  // Signatures
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('_______________________', 20, finalY + 45);
  doc.text('Class Teacher Signature', 23, finalY + 50);

  doc.text('_______________________', 130, finalY + 45);
  doc.text('Principal Signature', 138, finalY + 50);

  doc.save(`ReportCard-${studentName.replace(/\s+/g, '_')}-${examData.examType}.pdf`);
};

// Utility to download general attendance register
export const downloadAttendanceReport = async (className, date, records) => {
  const school = await getSchoolDetails();
  const schoolName = school?.name || 'EDUTRACK ACADEMY';
  const schoolAddress = school?.address || '100 School Lane, Education Heights';
  const schoolPhone = school?.phone || '';
  const schoolEmail = school?.email || 'support@edutrack.com';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Banner
  doc.setFillColor(75, 85, 99); // Gray 600
  doc.rect(0, 0, 210, 40, 'F');

  // Load and Add Logo if exists
  const logoUrl = school && school.logo
    ? (school.logo.startsWith('data:') || school.logo.startsWith('http') ? school.logo : `http://localhost:5000${school.logo}`)
    : '';

  let textX = 14;
  if (logoUrl) {
    const img = await loadImage(logoUrl);
    if (img) {
      doc.setFillColor(255, 255, 255);
      doc.rect(14, 8, 24, 24, 'F');
      doc.addImage(img, 'PNG', 15, 9, 22, 22);
      textX = 44;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(schoolName.toUpperCase(), textX, 17);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  const contactText = `${schoolAddress}${schoolPhone ? ' | Tel: ' + schoolPhone : ''} | Email: ${schoolEmail}`;
  const contactLines = doc.splitTextToSize(contactText, 200 - textX);
  doc.text(contactLines, textX, 23);
  doc.setFontSize(10);
  doc.text(`Daily Attendance Report | Room: ${className} | Date: ${new Date(date).toLocaleDateString()}`, textX, 33);

  const stats = {
    Present: records.filter(r => r.status === 'Present').length,
    Late: records.filter(r => r.status === 'Late').length,
    Absent: records.filter(r => r.status === 'Absent').length
  };

  // Stats Box
  doc.setFillColor(243, 244, 246);
  doc.rect(14, 48, 182, 16, 'F');
  doc.setTextColor(55, 65, 81);
  doc.setFont('Helvetica', 'bold');
  doc.text(`Total Enrolled: ${records.length}`, 20, 58);
  doc.setTextColor(16, 185, 129); // green
  doc.text(`Present: ${stats.Present}`, 70, 58);
  doc.setTextColor(245, 158, 11); // amber
  doc.text(`Late: ${stats.Late}`, 115, 58);
  doc.setTextColor(239, 68, 68); // red
  doc.text(`Absent: ${stats.Absent}`, 155, 58);

  const tableRows = records.map((rec, index) => [
    index + 1,
    rec.student?.user?.name || 'N/A',
    rec.student?.rollNumber || 'N/A',
    rec.status,
    rec.faceVerified ? 'Face Verified' : 'Manual',
    rec.markedBy?.name || 'N/A'
  ]);

  doc.autoTable({
    startY: 72,
    head: [['S.No', 'Student Name', 'Roll Number', 'Attendance Status', 'Method', 'Logged By']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [75, 85, 99] },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 27, halign: 'center' },
      5: { cellWidth: 20 }
    }
  });

  doc.save(`Attendance-${className}-${new Date(date).toISOString().split('T')[0]}.pdf`);
};

// Generic utility to download detailed multi-format attendance reports (Daily, Weekly, Monthly, Yearly)
export const downloadDetailedAttendanceReportPdf = async (reportTitle, headers, rows) => {
  const school = await getSchoolDetails();
  const schoolName = school?.name || 'EDUTRACK ACADEMY';
  const schoolAddress = school?.address || '100 School Lane, Education Heights';
  const schoolPhone = school?.phone || '';
  const schoolEmail = school?.email || 'support@edutrack.com';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Banner
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, 210, 40, 'F');

  // Load and Add Logo if exists
  const logoUrl = school && school.logo
    ? (school.logo.startsWith('data:') || school.logo.startsWith('http') ? school.logo : `http://localhost:5000${school.logo}`)
    : '';

  let textX = 14;
  if (logoUrl) {
    const img = await loadImage(logoUrl);
    if (img) {
      doc.setFillColor(255, 255, 255);
      doc.rect(14, 8, 24, 24, 'F');
      doc.addImage(img, 'PNG', 15, 9, 22, 22);
      textX = 44;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(schoolName.toUpperCase(), textX, 17);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  const contactText = `${schoolAddress}${schoolPhone ? ' | Tel: ' + schoolPhone : ''} | Email: ${schoolEmail}`;
  const contactLines = doc.splitTextToSize(contactText, 200 - textX);
  doc.text(contactLines, textX, 23);
  doc.setFontSize(10);
  doc.text(reportTitle.toUpperCase(), textX, 33);

  // Table
  doc.autoTable({
    startY: 48,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 8 },
    margin: { top: 48 }
  });

  doc.save(`${reportTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`);
};

