import React, { useState } from 'react';
import * as XLSX from 'xlsx';

function ExcelUpload({ setData }) {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0]; // Get the first sheet
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        setData(jsonData); // Pass data to parent component
      };
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
    </div>
  );
}

export default ExcelUpload;
