import axios from 'axios';

const SPREADSHEET_ID = '1qyrlI0zxKX_Hn4E3DnCU29NEuMiwnKBoONk18kppfBQ'; // Your Google Sheet ID
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY; // Access the API key from the .env file

const fetchSheetData = async () => {
  const range = 'Sheet1!A2:C'; // Include Date (A), Distance (B), and Flowrate (C)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`; // Use 'range' instead of 'RANGE'

  try {
    const response = await axios.get(url);
    console.log('API Response:', response.data); // Log response to debug
    return response.data.values; // Returns an array of rows from the sheet
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
};

export default fetchSheetData;
