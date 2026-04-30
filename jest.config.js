'use strict';

const path = require('path');
const fs = require('fs');

const root = process.cwd();

function getProjectRootMap() {
  const map = {};
  for (const dir of ['libs', 'apps']) {
    const dirPath = path.join(root, dir);
    if (!fs.existsSync(dirPath)) continue;
    for (const name of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const projectPath = path.join(dirPath, name.name);
      const projectJsonPath = path.join(projectPath, 'project.json');
      if (!fs.existsSync(projectJsonPath)) continue;
      try {
        const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
        if (projectJson.name) map[projectJson.name] = path.relative(root, projectPath);
      } catch (_) {}
    }
  }
  return map;
}

const projectRootMap = getProjectRootMap();
const projectName = process.env.NX_TASK_TARGET_PROJECT;
const projectRoot = projectName ? projectRootMap[projectName] : null;

if (!projectRoot) {
  throw new Error(
    `Jest: NX_TASK_TARGET_PROJECT is not set or unknown project "${projectName}". ` +
      `Known: ${Object.keys(projectRootMap).join(', ')}. ` +
      `Run tests via "nx run <project>:test".`
  );
}

const preset = require('./jest.preset.js');

module.exports = {
  ...preset,
  displayName: projectName,
  rootDir: projectRoot,
  coverageDirectory: path.join(root, 'coverage', projectRoot),
};
