/**
 * MAHALAXMI DEVELOPERS - GOOGLE SHEETS INTEGRATION
 * ============================================================================
 * INSTRUCTIONS:
 * 
 * 1. Go to https://docs.google.com/spreadsheets/ and create a new Google Sheet.
 * 2. Name the sheet something like "Mahalaxmi Developers Website Leads".
 * 3. In the first row (Row 1), type the following column headers exactly:
 *    A1: Timestamp
 *    B1: Context
 *    C1: Name
 *    D1: Phone
 *    E1: Email
 *    F1: Message
 *    G1: Page
 * 
 * 4. Click on "Extensions" in the top menu, then select "Apps Script".
 * 5. Delete any existing code in the editor, and paste EVERYTHING below this comment block.
 * 6. Click the "Save" icon (or press Ctrl+S).
 * 7. Click "Deploy" in the top right corner, then select "New deployment".
 * 8. Click the gear icon next to "Select type" and choose "Web app".
 *    - Description: Website Forms
 *    - Execute as: Me (<your google account>)
 *    - Who has access: Anyone
 * 9. Click "Deploy". You will be asked to authorize the app. Provide access.
 * 10. Copy the "Web app URL" that is generated.
 * 11. Open `js/app.js` in your website folder, find `CONFIG.sheetsEndpoint` and paste the URL.
 *     It should look like: sheetsEndpoint: "https://script.google.com/macros/s/.../exec",
 * ============================================================================
 */

const SHEET_NAME = "Sheet1"; // Change if your sheet tab is named differently

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getSheetByName(SHEET_NAME);

    // Setup headers if they don't exist
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];

    // Parse the JSON data sent from the website
    const data = JSON.parse(e.postData.contents);

    // Create a new row based on the incoming data matching the headers
    const newRow = headers.map(function(header) {
      if (header === "Timestamp") {
        return new Date(); // Record exactly when it was added
      } else {
        // Map header name to the data payload property
        const property = header.toLowerCase();
        return data[property] || "";
      }
    });

    // Append the newly formed row to the sheet
    sheet.appendRow(newRow);

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Function to handle preflight CORS requests from the browser
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
