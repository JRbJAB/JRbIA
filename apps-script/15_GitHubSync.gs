/**
 * JRbIA GitHub Sync.
 * File: 15_GitHubSync.gs
 * v0.3R1: GitHub sync module from live, no duplicate helpers.
 */

function JRBIA_syncGithubFromLiveSource_(mode) {
  const traceId = JRBIA_traceId_();
  const startedAt = new Date();
  const config = JRBIA_getConfig_();
  const live = JRBIA_getLiveProjectContent_();
  const backupFiles = JRBIA_buildBackupFiles_(live, traceId, startedAt, config);
  const ghFiles = JRBIA_buildGithubFiles_(backupFiles, live, traceId, startedAt, config);

  let pushed = 0;
  let commitUrls = [];
  let status = 'OK';
  let message = '';

  if (mode === 'APPLY') {
    if (config.allowGithubWrite !== true) {
      throw new Error('GitHub APPLY blocked. Set JRBIA_ALLOW_GITHUB_WRITE=TRUE.');
    }
    if (!config.githubToken) {
      throw new Error('GitHub token missing in Script Properties.');
    }
    ghFiles.forEach(file => {
      const res = JRBIA_upsertGithubFile_(config, file.path, file.content, traceId);
      pushed += 1;
      if (res && res.commitUrl) commitUrls.push(res.commitUrl);
    });
    message = 'GitHub files pushed via API';
  } else {
    message = 'DRY_RUN only, no GitHub write';
  }

  const result = {
    traceId,
    functionName: 'JRBIA_syncGithubFromLiveSource_',
    mode,
    status,
    version: JRBIA_CFG.VERSION,
    target: config.githubOwner + '/' + config.githubRepo,
    branch: config.githubBranch,
    pathPrefix: config.githubPathPrefix,
    plannedFiles: ghFiles.length,
    pushedFiles: pushed,
    firstCommitUrl: commitUrls[0] || '',
    message
  };

  JRBIA_log_(config, result);
  JRBIA_exportRow_(config, [new Date(), traceId, 'GitHub CLASP mirror', mode, status, result.target, result.firstCommitUrl, ghFiles.length, message]);
  return result;
}

function JRBIA_buildGithubFiles_(backupFiles, live, traceId, startedAt, config) {
  const prefix = (config.githubPathPrefix || '').replace(/^\/+|\/+$/g, '');
  const gh = [];

  gh.push({ path: 'README.md', content: JRBIA_buildGithubReadme_(traceId, startedAt, config) });
  gh.push({ path: 'CLASP_GITHUB_HANDOFF.md', content: backupFiles.find(f => f.path === 'CLASP_GITHUB_HANDOFF.md').content });

  if (config.githubIncludeClaspJson) {
    gh.push({ path: '.clasp.json', content: JSON.stringify({ scriptId: live.scriptId, rootDir: prefix || 'apps-script' }, null, 2) });
  } else {
    gh.push({ path: '.clasp.example.json', content: JSON.stringify({ scriptId: 'PUT_APPS_SCRIPT_ID_HERE', rootDir: prefix || 'apps-script' }, null, 2) });
  }

  backupFiles.forEach(f => {
    const path = prefix ? prefix + '/' + f.path : f.path;
    gh.push({ path, content: f.content });
  });
  return gh;
}

function JRBIA_upsertGithubFile_(config, path, content, traceId) {
  const base = 'https://api.github.com/repos/' + encodeURIComponent(config.githubOwner) + '/' + encodeURIComponent(config.githubRepo) + '/contents/' + path.split('/').map(encodeURIComponent).join('/');
  const existing = JRBIA_githubRequest_(config, base + '?ref=' + encodeURIComponent(config.githubBranch), 'get', null, true);
  const sha = existing && existing.sha ? existing.sha : null;
  const body = {
    message: 'JRbIA Apps Script live backup ' + traceId + ' — ' + path,
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: config.githubBranch
  };
  if (sha) body.sha = sha;
  if (config.githubCommitterName && config.githubCommitterEmail) {
    body.committer = { name: config.githubCommitterName, email: config.githubCommitterEmail };
  }
  const res = JRBIA_githubRequest_(config, base, 'put', body, false);
  return { commitUrl: res && res.commit && res.commit.html_url ? res.commit.html_url : '' };
}

function JRBIA_githubRequest_(config, url, method, payload, allow404) {
  const options = {
    method,
    headers: {
      Authorization: 'Bearer ' + config.githubToken,
      Accept: 'application/vnd.github+json'
    },
    muteHttpExceptions: true
  };
  if (payload) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }
  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  if (allow404 && code === 404) return null;
  if (code < 200 || code >= 300) {
    throw new Error('GitHub API failed HTTP ' + code + ': ' + response.getContentText().slice(0, 800));
  }
  return JSON.parse(response.getContentText() || '{}');
}

function JRBIA_buildGithubReadme_(traceId, startedAt, config) {
  return [
    '# 🧠 JRbIA — Apps Script Backup Mirror',
    '',
    'Generated from live Apps Script source.',
    '',
    '- Trace: `' + traceId + '`',
    '- Generated: `' + startedAt.toISOString() + '`',
    '- Target: `' + config.githubOwner + '/' + config.githubRepo + '`',
    '- Branch: `' + config.githubBranch + '`',
    '',
    'Security: GitHub tokens are not stored in this repo. Runtime values are stored in Apps Script Properties.',
    '',
    'CLASP: this repo contains a CLASP-compatible tree. Use `clasp status` and `clasp pull` locally. Do not run `clasp push` without review.'
  ].join('\n');
}
