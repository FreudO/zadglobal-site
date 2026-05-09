/**
 * ZAD contact form → Google Sheet (wide table) + Drive attachments.
 *
 * Setup:
 * 1. Create/bind this script to your target Spreadsheet (Extensions → Apps Script).
 * 2. Script properties: UPLOAD_FOLDER_ID (required), FORM_SECRET (optional).
 * 3. Deploy → Web app → Execute as: Me, Who has access: Anyone.
 * 4. POST URL (ends in /exec) → GOOGLE_CONTACT_SCRIPT_URL in site script.js
 *
 * Data is written to a tab named "Submissions" (created if missing) so you do not
 * collide with an older narrow table on Sheet1.
 */

var SUBMISSION_SHEET_NAME = 'Submissions';

var HEADERS = [
  'Submitted',
  'Email',
  'First name',
  'Organization',
  'WhatsApp',
  'Country',
  'Business type',
  'Sites / teams',
  'Intake selections',
  'Request scope',
  'AI monthly volume',
  'AI current tools',
  'AI work start',
  'AI reviewers',
  'AI repetitive work',
  'Software main users',
  'Software existing systems',
  'Software must-have feature',
  'Software target timeline',
  'Software required outcomes',
  'Training audience',
  'Training people count',
  'Training preferred format',
  'Training existing materials',
  'Training target capabilities',
  'Robotics field environment',
  'Robotics monitoring targets',
  'Robotics constraints',
  'Robotics current hardware',
  'Robotics management decision',
  'Finance main objective',
  'Finance accounts or processes',
  'Finance decision timeframe',
  'Finance stakeholders',
  'Finance decision details',
  'General countries involved',
  'General preferred next step',
  'General conversation goal',
  'Additional context',
  'Brief readable',
  'Fields JSON backup',
  'File URLs'
];

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ensureHeaders_(sheet) {
  var a1 = sheet.getRange(1, 1).getValue();
  if (a1 !== 'Submitted') {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function getSubmissionSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SUBMISSION_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SUBMISSION_SHEET_NAME);
  }
  ensureHeaders_(sh);
  return sh;
}

function cell_(v) {
  if (v == null) return '';
  var s = String(v);
  if (s.length > 49000) return s.substring(0, 49000) + '…[truncated]';
  return s;
}

function rowFromPayload_(body, fileUrls, submitted) {
  var f = body.fields || {};
  var m = body.meta || {};
  var email = m.email || f.email || '';
  var first = m.first_name || f.first_name || '';
  var org = m.organization || f.organization || '';
  var wa = m.whatsapp || f.whatsapp || '';
  var country = m.country || f.country || '';

  var fieldsJson = '';
  try {
    fieldsJson = JSON.stringify(f);
  } catch (e) {
    fieldsJson = '';
  }
  if (fieldsJson.length > 49000) {
    fieldsJson = fieldsJson.substring(0, 49000) + '…[truncated]';
  }

  return [
    submitted,
    cell_(email),
    cell_(first),
    cell_(org),
    cell_(wa),
    cell_(country),
    cell_(f.business_type),
    cell_(f.sites_teams),
    cell_(f.intake_selection),
    cell_(body.request_scope || f.request_scope || ''),
    cell_(f.ai_monthly_volume),
    cell_(f.ai_current_tools),
    cell_(f.ai_work_start),
    cell_(f.ai_reviewers),
    cell_(f.ai_repetitive_work),
    cell_(f.software_main_users),
    cell_(f.software_existing_systems),
    cell_(f.software_must_have_feature),
    cell_(f.software_target_timeline),
    cell_(f.software_required_outcomes),
    cell_(f.training_audience),
    cell_(f.training_people_count),
    cell_(f.training_preferred_format),
    cell_(f.training_existing_materials),
    cell_(f.training_target_capabilities),
    cell_(f.robotics_field_environment),
    cell_(f.robotics_monitoring_targets),
    cell_(f.robotics_constraints),
    cell_(f.robotics_current_hardware),
    cell_(f.robotics_management_decision),
    cell_(f.finance_main_objective),
    cell_(f.finance_accounts_or_processes),
    cell_(f.finance_decision_timeframe),
    cell_(f.finance_stakeholders),
    cell_(f.finance_decision_details),
    cell_(f.general_countries_involved),
    cell_(f.general_preferred_next_step),
    cell_(f.general_conversation_goal),
    cell_(f.additional_context),
    cell_(body.readable_summary || ''),
    fieldsJson,
    fileUrls.join('\n')
  ];
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ success: false, error: 'No body' });
    }

    var body = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty('FORM_SECRET');
    if (expected && body.secret !== expected) {
      return jsonOut({ success: false, error: 'Unauthorized' });
    }

    var folderId = props.getProperty('UPLOAD_FOLDER_ID');
    if (!folderId) {
      return jsonOut({ success: false, error: 'UPLOAD_FOLDER_ID not set in Script properties' });
    }

    var folder = DriveApp.getFolderById(folderId);
    var sheet = getSubmissionSheet_();

    var fileUrls = [];
    var attachments = body.attachments || [];
    for (var i = 0; i < attachments.length; i++) {
      var a = attachments[i];
      if (!a || !a.data || !a.filename) continue;
      var bytes = Utilities.base64Decode(a.data);
      var blob = Utilities.newBlob(bytes, a.mimeType || 'application/octet-stream', a.filename);
      var file = folder.createFile(blob);
      fileUrls.push(file.getUrl());
    }

    var row = rowFromPayload_(body, fileUrls, new Date());
    sheet.appendRow(row);

    return jsonOut({ success: true });
  } catch (err) {
    return jsonOut({ success: false, error: String(err && err.message ? err.message : err) });
  }
}
