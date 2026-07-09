/**
 * JRbIA Backup config.
 * File: 01_Config.gs
 * v0.3R1: kept from live, version updated, no monofile duplicates.
 */

const JRBIA_CFG = {
  VERSION: 'v0.3.0-CLEAN_SPLIT_FROM_LIVE_7924BFE3',
  LOG_SHEET: '🧾 Logs AS',
  EXPORT_SHEET: '📤 Exports AS',
  DEFAULT_GITHUB_OWNER: 'JRbJAB',
  DEFAULT_GITHUB_REPO: 'JRbIA',
  DEFAULT_GITHUB_BRANCH: 'main',
  DEFAULT_GITHUB_PATH_PREFIX: 'apps-script',
  DEFAULT_COMMITTER_NAME: 'JRbIA Apps Script Backup',
  DEFAULT_COMMITTER_EMAIL: 'julien@riotte.work'
};

const JRBIA_PROP = {
  ALLOW_SOURCE_BACKUP_WRITE: 'JRBIA_ALLOW_SOURCE_BACKUP_WRITE',
  SOURCE_BACKUP_FOLDER_ID: 'JRBIA_SOURCE_BACKUP_FOLDER_ID',
  COCKPIT_SPREADSHEET_ID: 'JRBIA_COCKPIT_SPREADSHEET_ID',
  ALLOW_GITHUB_WRITE: 'JRBIA_ALLOW_GITHUB_WRITE',
  GITHUB_TOKEN: 'JRBIA_GITHUB_TOKEN',
  GITHUB_OWNER: 'JRBIA_GITHUB_OWNER',
  GITHUB_REPO: 'JRBIA_GITHUB_REPO',
  GITHUB_BRANCH: 'JRBIA_GITHUB_BRANCH',
  GITHUB_PATH_PREFIX: 'JRBIA_GITHUB_PATH_PREFIX',
  GITHUB_INCLUDE_CLASP_JSON: 'JRBIA_GITHUB_INCLUDE_CLASP_JSON',
  GITHUB_COMMITTER_NAME: 'JRBIA_GITHUB_COMMITTER_NAME',
  GITHUB_COMMITTER_EMAIL: 'JRBIA_GITHUB_COMMITTER_EMAIL'
};

function JRBIA_getConfig_(options) {
  const opts = options || {};
  const p = PropertiesService.getScriptProperties();

  const config = {
    allowSourceBackupWrite: JRBIA_bool_(p.getProperty(JRBIA_PROP.ALLOW_SOURCE_BACKUP_WRITE)),
    sourceBackupFolderId: p.getProperty(JRBIA_PROP.SOURCE_BACKUP_FOLDER_ID),
    cockpitSpreadsheetId: p.getProperty(JRBIA_PROP.COCKPIT_SPREADSHEET_ID),

    allowGithubWrite: JRBIA_bool_(p.getProperty(JRBIA_PROP.ALLOW_GITHUB_WRITE)),
    githubToken: p.getProperty(JRBIA_PROP.GITHUB_TOKEN),
    githubOwner: p.getProperty(JRBIA_PROP.GITHUB_OWNER) || JRBIA_CFG.DEFAULT_GITHUB_OWNER,
    githubRepo: p.getProperty(JRBIA_PROP.GITHUB_REPO) || JRBIA_CFG.DEFAULT_GITHUB_REPO,
    githubBranch: p.getProperty(JRBIA_PROP.GITHUB_BRANCH) || JRBIA_CFG.DEFAULT_GITHUB_BRANCH,
    githubPathPrefix: p.getProperty(JRBIA_PROP.GITHUB_PATH_PREFIX) || JRBIA_CFG.DEFAULT_GITHUB_PATH_PREFIX,
    githubIncludeClaspJson: JRBIA_bool_(p.getProperty(JRBIA_PROP.GITHUB_INCLUDE_CLASP_JSON)),
    githubCommitterName: p.getProperty(JRBIA_PROP.GITHUB_COMMITTER_NAME) || JRBIA_CFG.DEFAULT_COMMITTER_NAME,
    githubCommitterEmail: p.getProperty(JRBIA_PROP.GITHUB_COMMITTER_EMAIL) || JRBIA_CFG.DEFAULT_COMMITTER_EMAIL
  };

  if (!opts.allowMissingOptional) {
    JRBIA_required_(config.sourceBackupFolderId, JRBIA_PROP.SOURCE_BACKUP_FOLDER_ID);
  }

  return config;
}

function JRBIA_required_(value, key) {
  if (!value) throw new Error('Missing Script Property: ' + key);
}

function JRBIA_bool_(value) {
  return String(value || '').trim().toUpperCase() === 'TRUE';
}

function JRBIA_traceId_() {
  return Utilities.getUuid().slice(0, 8);
}

function JRBIA_stamp_(dateObj) {
  return Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
}
