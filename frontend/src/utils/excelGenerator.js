/**
 * Downloads a spreadsheet (CSV format, natively openable in Microsoft Excel)
 * @param {string} title - Report title
 * @param {string[]} headers - Array of column header names
 * @param {any[][]} rows - 2D array of row cells
 */
export const downloadAttendanceExcel = (title, headers, rows) => {
  try {
    let csvContent = "";

    // Add Byte Order Mark (BOM) for Excel to recognize UTF-8 encoding properly
    csvContent += "\uFEFF";

    // Title Row
    csvContent += `"${title.replace(/"/g, '""')}"\n\n`;

    // Headers Row
    csvContent += headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(",") + "\n";

    // Data Rows
    rows.forEach(row => {
      csvContent += row.map(cell => {
        const value = cell === null || cell === undefined ? "" : String(cell);
        return `"${value.replace(/"/g, '""')}"`;
      }).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date().toISOString().split('T')[0]}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export Excel report:', error);
    alert('Failed to generate Excel sheet: ' + error.message);
  }
};
