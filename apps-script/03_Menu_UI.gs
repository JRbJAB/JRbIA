/**
 * JRbIA Backup menu and sidebar.
 * File: 03_Menu_UI.gs
 * v0.3R1: UI module from live. Keep only one global onOpen in the project.
 */

function onOpen() {
  JRBIA_addBackupMenu_();
}

function JRBIA_addBackupMenu_() {
  SpreadsheetApp.getUi()
    .createMenu('💾 JRbIA Backup')
    .addItem('État backup / GitHub', 'JRBIA_showBackupSidebar')
    .addSeparator()
    .addItem('💾 Source backup Drive — dry-run', 'JRBIA_menuBackupSourceDryRun_')
    .addItem('💾 Source backup Drive — APPLY protégé', 'JRBIA_menuBackupSourceApply_')
    .addSeparator()
    .addItem('🐙 GitHub sync depuis source live — dry-run', 'JRBIA_menuGithubDryRun_')
    .addItem('🐙 GitHub sync depuis source live — APPLY protégé', 'JRBIA_menuGithubApply_')
    .addSeparator()
    .addItem('💾 Backup complet Drive + CLASP + GitHub — dry-run', 'JRBIA_menuFullDryRun_')
    .addItem('💾 Backup complet Drive + CLASP + GitHub — APPLY protégé', 'JRBIA_menuFullApply_')
    .addToUi();
}

function JRBIA_showBackupSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('04_Sidebar')
    .setTitle('💾 JRbIA Backup');
  SpreadsheetApp.getUi().showSidebar(html);
}

function JRBIA_menuBackupSourceDryRun_() {
  JRBIA_alertResult_('Source backup dry-run', JRBIA_backupSourceDryRun());
}

function JRBIA_menuBackupSourceApply_() {
  if (!JRBIA_confirmApply_('Créer un ZIP Drive depuis le source live Apps Script ?')) return;
  JRBIA_alertResult_('Source backup APPLY', JRBIA_backupSourceToDriveApply());
}

function JRBIA_menuGithubDryRun_() {
  JRBIA_alertResult_('GitHub sync dry-run', JRBIA_syncGithubDryRun());
}

function JRBIA_menuGithubApply_() {
  if (!JRBIA_confirmApply_('Pousser la structure CLASP vers GitHub via API ?')) return;
  JRBIA_alertResult_('GitHub sync APPLY', JRBIA_syncGithubApply());
}

function JRBIA_menuFullDryRun_() {
  JRBIA_alertResult_('Backup complet dry-run', JRBIA_backupDriveClaspGithubDryRun());
}

function JRBIA_menuFullApply_() {
  if (!JRBIA_confirmApply_('Créer ZIP Drive + pousser GitHub via API ?')) return;
  JRBIA_alertResult_('Backup complet APPLY', JRBIA_backupDriveClaspGithubApply());
}

function JRBIA_confirmApply_(message) {
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert('APPLY protégé', message + '\n\nContinuer ?', ui.ButtonSet.YES_NO);
  return res === ui.Button.YES;
}

function JRBIA_alertResult_(title, result) {
  SpreadsheetApp.getUi().alert(title, JSON.stringify(result, null, 2), SpreadsheetApp.getUi().ButtonSet.OK);
}
