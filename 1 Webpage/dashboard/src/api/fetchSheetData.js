const fetchSheetData = async () => {
    try {
      const response = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets/1qyrlI0zxKX_Hn4E3DnCU29NEuMiwnKBoONk18kppfBQ/values/Sheet1!B:C?key=AIzaSyDfQX-VToR_ylK405gBCCX5_u0wQeNBxnY'
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Fetched sheet data:", data.values); // Debugging
  
      return data.values; // Return only the data rows
    } catch (error) {
      console.error("Error fetching Google Sheets data:", error);
      return []; // Return empty array if error occurs
    }
  };
  
  export default fetchSheetData;
  