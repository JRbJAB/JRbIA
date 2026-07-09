/**
 * JRbIA Source Backup.
 * File: 14_SourceBackup.gs
 * v0.3R1: source-backup module from live, with DRY_RUN config permissive.
 */

function JRBIA_backupSourceToDrive_(mode) {
  const traceId = JRBIA_traceId_();
  const startedAt = new Date();
  const config = JRBIA_getConfig_(mode === 'DRY_RUN' ? { allowMissingOptional: true } : {});
  const live = JRBIA_getLiveProjectContent_();
  const backupFiles = JRBIA_buildBackupFiles_(live, traceId, startedAt, config);
  const zipName = 'jrbia_apps_script_live_source_backup_' + JRBIA_stamp_(startedAt) + '_' + traceId + '.zip';

  let zipUrl = '';
  let status = 'OK';
  let message = '';

  if (mode === 'APPLY') {
    if (config.allowSourceBackupWrite !== true) {
      throw new Error('Source backup APPLY blocked. Set JRBIA_ALLOW_SOURCE_BACKUP_WRITE=TRUE.');
    }
    const folder = DriveApp.getFolderById(config.sourceBackupFolderId);
    const blobs = backupFiles.map(f => Utilities.newBlob(f.content, f.mimeType || 'text/plain', f.path));
    const zipBlob = Utilities.zip(blobs, zipName);
    const zipFile = folder.createFile(zipBlob);
    zipUrl = zipFile.getUrl();
    message = 'ZIP Drive created';
  } else {
    message = 'DRY_RUN only, no Drive ZIP created';
  }

  const result = {
    traceId,
    functionName: 'JRBIA_backupSourceToDrive_',
    mode,
    status,
    version: JRBIA_CFG.VERSION,
    files: backupFiles.length,
    zipName,
    zipUrl,
    message
  };

  JRBIA_log_(config, result);
  JRBIA_exportRow_(config, [new Date(), traceId, 'ZIP Apps Script live source backup', mode, status, zipName, zipUrl, backupFiles.length, message]);
  return result;
}

function JRBIA_getLiveProjectContent_() {
  const scriptId = ScriptApp.getScriptId();
  const url = 'https://script.googleapis.com/v1/projects/' + encodeURIComponent(scriptId) + '/content';
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('Apps Script API projects.getContent failed HTTP ' + code + ': ' + response.getContentText().slice(0, 500));
  }
  const payload = JSON.parse(response.getContentText());
  return {
    scriptId,
    files: payload.files || []
  };
}

function JRBIA_buildBackupFiles_(live, traceId, startedAt, config) {
  const files = [];
  live.files.forEach(f => {
    files.push({
      path: JRBIA_toSourcePath_(f),
      content: f.source || '',
      mimeType: 'text/plain'
    });
  });

  const manifest = {
    project: 'JRbIA',
    version: JRBIA_CFG.VERSION,
    traceId,
    createdAt: startedAt.toISOString(),
    scriptId: live.scriptId,
    fileCount: files.length,
    githubTarget: config.githubOwner + '/' + config.githubRepo,
    githubBranch: config.githubBranch,
    githubPathPrefix: config.githubPathPrefix
  };

  files.push({ path: '_backup_manifest.json', content: JSON.stringify(manifest, null, 2), mimeType: 'application/json' });
  files.push({ path: '_file_index.csv', content: JRBIA_buildFileIndexCsv_(files), mimeType: 'text/csv' });
  files.push({ path: 'CLASP_GITHUB_HANDOFF.md', content: JRBIA_buildHandoff_(manifest), mimeType: 'text/markdown' });
  return files;
}

function JRBIA_toSourcePath_(file) {
  const name = file.name || 'Untitled';
  const type = file.type || '';
  if (name === 'appsscript' || name === 'appsscript.json') return 'appsscript.json';
  if (type === 'SERVER_JS') return name + '.gs';
  if (type === 'HTML') return name + '.html';
  if (type === 'JSON') return name + '.json';
  return name + '.txt';
}

function JRBIA_buildFileIndexCsv_(files) {
  const rows = [['path', 'bytes']];
  files.forEach(f => rows.push([f.path, String((f.content || '').length)]));
  return rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
}

function JRBIA_buildHandoff_(manifest) {
  return [
    '# JRbIA CLASP GitHub Handoff',
    '',
    'Trace: `' + manifest.traceId + '`',
    'Version: `' + manifest.version + '`',
    'Created: `' + manifest.createdAt + '`',
    'GitHub target: `' + manifest.githubTarget + '`',
    'Branch: `' + manifest.githubBranch + '`',
    'Path prefix: `' + manifest.githubPathPrefix + '`',
    '',
    'Apps Script captured from live project via projects.getContent.',
    'The repository tree is CLASP-compatible.',
    '',
    'Default prohibition: no `clasp push` without human review.'
  ].join('\n');
}

function JRBIA_log_(config, result) {
  if (!config.cockpitSpreadsheetId) return;
  const ss = SpreadsheetApp.openById(config.cockpitSpreadsheetId);
  const sh = JRBIA_ensureSheet_(ss, JRBIA_CFG.LOG_SHEET, ['Timestamp', 'Trace ID', 'Function', 'Mode', 'Status', 'Version', 'Message', 'JSON']);
  sh.appendRow([new Date(), result.traceId || '', result.functionName || '', result.mode || '', result.status || '', JRBIA_CFG.VERSION, result.message || '', JSON.stringify(result)]);
}

function JRBIA_exportRow_(config, row) {
  if (!config.cockpitSpreadsheetId) return;
  const ss = SpreadsheetApp.openById(config.cockpitSpreadsheetId);
  const sh = JRBIA_ensureSheet_(ss, JRBIA_CFG.EXPORT_SHEET, ['Timestamp', 'Trace ID', 'Type', 'Mode', 'Status', 'Name/Target', 'URL', 'Count', 'Notes']);
  sh.appendRow(row);
}

function JRBIA_ensureSheet_(ss, name, header) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, header.length).setValues([header]);
  return sh;
}
