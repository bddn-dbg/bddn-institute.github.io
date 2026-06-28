/**
 * code.gs - Google Apps Script Web App
 * Pasted inside Google Sheets Extensions -> Apps Script
 * Handles POST requests from the BDDN enrollment form
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Acquire a lock for 30 seconds to prevent race conditions during concurrent submissions
    lock.waitLock(30000);
    
    // Parse the active spreadsheet
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();
    
    // Check if the headers exist, if not, create them
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Full Name", "Phone Number", "Selected Course", "Message (Optional)"]);
    }
    
    // Parse JSON payload
    var data = JSON.parse(e.postData.contents);
    
    var timestamp = new Date();
    var name = data.name;
    var phone = data.phone;
    var course = data.course;
    var message = data.message || "";
    
    // Append data row
    sheet.appendRow([timestamp, name, phone, course, message]);
    
    // Return success response with CORS headers
    return ContentService
      .createTextOutput(JSON.stringify({ "success": true, "message": "Enrollment recorded successfully in Google Sheets." }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ "success": false, "error": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } finally {
    // Release the lock
    lock.releaseLock();
  }
}

// Handle CORS Preflight OPTIONS requests
function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
