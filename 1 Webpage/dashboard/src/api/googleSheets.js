const fetchSheetData = async () => {
  try {
    const response = await fetch(
      'https://sheets.googleapis.com/v4/spreadsheets/1qyrlI0zxKX_Hn4E3DnCU29NEuMiwnKBoONk18kppfBQ/values/Sheet1!B:C?key=AIzaSyDfQX-VToR_ylK405gBCCX5_u0wQeNBxnY'
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched sheet data:", data.values); // ✅ Log fetched data

    // ✅ Optional: Uncomment this line if your sheet has headers like ["Distance", "FlowRate"]
    // return data.values.slice(1);

    return data.values; // Return data as array of rows
  } catch (error) {
    console.error("Error fetching Google Sheets data:", error);
    return []; // Return empty array if there's an error
  }
};

export default fetchSheetData;
