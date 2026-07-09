/**
 * JRbIA Backup entrypoints.
 * File: 00_Code.gs
 * Version: v0.3.0-CLEAN_SPLIT_FROM_LIVE_7924BFE3
 *
 * CLEAN SPLIT RULE:
 * - This file contains only public entrypoints and lightweight orchestration.
 * - No core helper is duplicated here.
 * - Core logic lives in 14_SourceBackup.gs and 15_GitHubSync.gs.
 */

function JRBIA_backupSourceDryRun() {
  return JRBIA_backupSourceToDrive_('DRY_RUN');
}

function JRBIA_backupSourceToDriveApply() {
  return JRBIA_backupSourceToDrive_('APPLY');
}

function JRBIA_backupDriveClaspGithubDryRun() {
  return JRBIA_backupDriveClaspGithub_('DRY_RUN');
}

function JRBIA_backupDriveClaspGithubApply() {
  return JRBIA_backupDriveClaspGithub_('APPLY');
}

function JRBIA_syncGithubDryRun() {
  return JRBIA_syncGithubFromLiveSource_('DRY_RUN');
}

function JRBIA_syncGithubApply() {
  return JRBIA_syncGithubFromLiveSource_('APPLY');
}

function JRBIA_backupDriveClaspGithub_(mode) {
  const sourceResult = JRBIA_backupSourceToDrive_(mode);
  const githubResult = JRBIA_syncGithubFromLiveSource_(mode);
  const ok = sourceResult && sourceResult.status === 'OK' && githubResult && githubResult.status === 'OK';
  return {
    functionName: 'JRBIA_backupDriveClaspGithub_',
    mode: mode,
    source: sourceResult,
    github: githubResult,
    status: ok ? 'OK' : 'REVIEW'
  };
}

function JRBIA_getBackupStatus() {
  const config = JRBIA_getConfig_({ allowMissingOptional: true });
  return {
    version: JRBIA_CFG.VERSION,
    allowSourceBackupWrite: config.allowSourceBackupWrite,
    sourceBackupFolderIdSet: Boolean(config.sourceBackupFolderId),
    cockpitSpreadsheetIdSet: Boolean(config.cockpitSpreadsheetId),
    allowGithubWrite: config.allowGithubWrite,
    githubOwner: config.githubOwner,
    githubRepo: config.githubRepo,
    githubBranch: config.githubBranch,
    githubPathPrefix: config.githubPathPrefix,
    githubTokenSet: Boolean(config.githubToken),
    githubIncludeClaspJson: config.githubIncludeClaspJson
  };
}
