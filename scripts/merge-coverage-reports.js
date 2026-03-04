const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const APPS_DIR = path.join(WORKSPACE_ROOT, 'apps');
const PACKAGES_DIR = path.join(WORKSPACE_ROOT, 'packages');
const DISTRO_DIR = path.join(WORKSPACE_ROOT, 'distro');
const OUTPUT_DIR = path.join(WORKSPACE_ROOT, 'test-output', 'jest', 'coverage');

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function findCoverageReports() {
  const reports = [];

  function scanDirectory(baseDir, type) {
    if (!fs.existsSync(baseDir)) return;

    const entries = fs.readdirSync(baseDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const coverageSourcePath = path.join(baseDir, entry.name, 'test-output', 'jest', 'coverage');
      const coverageIndexPath = path.join(coverageSourcePath, 'index.html');

      if (fs.existsSync(coverageIndexPath)) {
        const coverageDestPath = path.join(OUTPUT_DIR, type, entry.name);
        copyDirectory(coverageSourcePath, coverageDestPath);

        const stats = extractCoverageStats(coverageIndexPath);
        reports.push({
          name: entry.name,
          type: type,
          relativePath: path.join(type, entry.name, 'index.html'),
          stats: stats
        });
      }
    }
  }

  scanDirectory(APPS_DIR, 'apps');
  scanDirectory(PACKAGES_DIR, 'packages');

  const distroCoverageSourcePath = path.join(DISTRO_DIR, 'test-output', 'jest', 'coverage');
  const distroCoverageIndexPath = path.join(distroCoverageSourcePath, 'index.html');
  if (fs.existsSync(distroCoverageIndexPath)) {
    const coverageDestPath = path.join(OUTPUT_DIR, 'distro');
    copyDirectory(distroCoverageSourcePath, coverageDestPath);

    const stats = extractCoverageStats(distroCoverageIndexPath);
    reports.push({
      name: 'distro',
      type: 'distro',
      relativePath: path.join('distro', 'index.html'),
      stats: stats
    });
  }

  return reports;
}

function extractCoverageStats(htmlPath) {
  try {
    const content = fs.readFileSync(htmlPath, 'utf8');

    const extractStat = (label) => {
      const regex = new RegExp(`<span class=['"]quiet['"]>${label}<\\/span>\\s*<span class=['"]fraction['"]>([\\d.]+)\\/(\\d+)<\\/span>`, 'i');
      const match = content.match(regex);
      if (match) {
        const covered = parseFloat(match[1]);
        const total = parseFloat(match[2]);
        const pct = total > 0 ? ((covered / total) * 100).toFixed(2) : 0;
        return { pct, covered, total };
      }
      return { pct: 0, covered: 0, total: 0 };
    };

    return {
      statements: extractStat('Statements'),
      branches: extractStat('Branches'),
      functions: extractStat('Functions'),
      lines: extractStat('Lines')
    };
  } catch (error) {
    return {
      statements: { pct: 0, covered: 0, total: 0 },
      branches: { pct: 0, covered: 0, total: 0 },
      functions: { pct: 0, covered: 0, total: 0 },
      lines: { pct: 0, covered: 0, total: 0 }
    };
  }
}

function copyAssets() {
  const assetsSource = path.join(DISTRO_DIR, 'test-output', 'jest', 'coverage');
  const assets = ['base.css', 'prettify.css', 'prettify.js', 'sorter.js', 'block-navigation.js', 'favicon.png', 'sort-arrow-sprite.png'];

  if (!fs.existsSync(assetsSource)) {
    console.warn(`\x1b[33m⚠\x1b[0m Coverage assets not found at ${assetsSource}, skipping asset copy`);
    return;
  }

  assets.forEach(asset => {
    const src = path.join(assetsSource, asset);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(OUTPUT_DIR, asset));
    }
  });
}

function getCoverageClass(pct) {
  return pct >= 80 ? 'high' : pct >= 50 ? 'medium' : 'low';
}

function generateIndexHTML(reports) {
  const appReports = reports.filter(r => r.type === 'apps').sort((a, b) => a.name.localeCompare(b.name));
  const packageReports = reports.filter(r => r.type === 'packages').sort((a, b) => a.name.localeCompare(b.name));
  const distroReports = reports.filter(r => r.type === 'distro');

  const allReports = [...distroReports, ...appReports, ...packageReports];

  const totals = allReports.reduce((acc, report) => {
    acc.statements.covered += report.stats.statements.covered;
    acc.statements.total += report.stats.statements.total;
    acc.branches.covered += report.stats.branches.covered;
    acc.branches.total += report.stats.branches.total;
    acc.functions.covered += report.stats.functions.covered;
    acc.functions.total += report.stats.functions.total;
    acc.lines.covered += report.stats.lines.covered;
    acc.lines.total += report.stats.lines.total;
    return acc;
  }, {
    statements: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    lines: { covered: 0, total: 0 }
  });

  const calcPct = (covered, total) => total > 0 ? ((covered / total) * 100).toFixed(2) : 0;

  totals.statements.pct = calcPct(totals.statements.covered, totals.statements.total);
  totals.branches.pct = calcPct(totals.branches.covered, totals.branches.total);
  totals.functions.pct = calcPct(totals.functions.covered, totals.functions.total);
  totals.lines.pct = calcPct(totals.lines.covered, totals.lines.total);

  const generateTableRows = (reportsList) => {
    return reportsList.map(report => {
      const stmtPct = parseFloat(report.stats.statements.pct);
      const branchPct = parseFloat(report.stats.branches.pct);
      const funcPct = parseFloat(report.stats.functions.pct);
      const linesPct = parseFloat(report.stats.lines.pct);

      return `<tr>
\t<td class="file ${getCoverageClass(stmtPct)}" data-value="${report.name}"><a href="${report.relativePath}">${report.name}</a></td>
\t<td data-value="${stmtPct}" class="pic ${getCoverageClass(stmtPct)}">
\t<div class="chart"><div class="cover-fill cover-full" style="width: ${stmtPct}%"></div><div class="cover-empty" style="width: ${100 - stmtPct}%"></div></div>
\t</td>
\t<td data-value="${stmtPct}" class="pct ${getCoverageClass(stmtPct)}">${stmtPct}%</td>
\t<td data-value="${report.stats.statements.covered}" class="abs ${getCoverageClass(stmtPct)}">${report.stats.statements.covered}/${report.stats.statements.total}</td>
\t<td data-value="${branchPct}" class="pct ${getCoverageClass(branchPct)}">${branchPct}%</td>
\t<td data-value="${report.stats.branches.covered}" class="abs ${getCoverageClass(branchPct)}">${report.stats.branches.covered}/${report.stats.branches.total}</td>
\t<td data-value="${funcPct}" class="pct ${getCoverageClass(funcPct)}">${funcPct}%</td>
\t<td data-value="${report.stats.functions.covered}" class="abs ${getCoverageClass(funcPct)}">${report.stats.functions.covered}/${report.stats.functions.total}</td>
\t<td data-value="${linesPct}" class="pct ${getCoverageClass(linesPct)}">${linesPct}%</td>
\t<td data-value="${report.stats.lines.covered}" class="abs ${getCoverageClass(linesPct)}">${report.stats.lines.covered}/${report.stats.lines.total}</td>
\t</tr>
`;
    }).join('');
  };

  return `
<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for All files</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="prettify.css" />
    <link rel="stylesheet" href="base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(sort-arrow-sprite.png);
        }
    </style>
</head>

<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1>All files</h1>
        <div class='clearfix'>

            <div class='fl pad1y space-right2'>
                <span class="strong">${totals.statements.pct}% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>${totals.statements.covered}/${totals.statements.total}</span>
            </div>


            <div class='fl pad1y space-right2'>
                <span class="strong">${totals.branches.pct}% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>${totals.branches.covered}/${totals.branches.total}</span>
            </div>


            <div class='fl pad1y space-right2'>
                <span class="strong">${totals.functions.pct}% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>${totals.functions.covered}/${totals.functions.total}</span>
            </div>


            <div class='fl pad1y space-right2'>
                <span class="strong">${totals.lines.pct}% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>${totals.lines.covered}/${totals.lines.total}</span>
            </div>


        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line ${getCoverageClass(parseFloat(totals.statements.pct))}'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody>${generateTableRows(allReports)}
</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated at ${new Date().toISOString()}
            </div>
        <script src="prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="sorter.js"></script>
        <script src="block-navigation.js"></script>
    </body>
</html>
    `;
}

function getCoverageIndicator(pct) {
  const coverage = parseFloat(pct);
  if (coverage >= 80) {
    return '\x1b[32m✔\x1b[0m';
  } else if (coverage >= 50) {
    return '\x1b[33m⚠\x1b[0m';
  } else {
    return '\x1b[31m✘\x1b[0m';
  }
}

function main() {
  const reports = findCoverageReports();

  console.log(`Found ${reports.length} coverage report(s):`);
  reports.forEach(report => {
    const indicator = getCoverageIndicator(report.stats.statements.pct);
    console.log(
      `  ${indicator} ${report.type}/${report.name} (${report.stats.statements.pct}% coverage)`,
    );
  });

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  copyAssets();

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'index.html'),
    generateIndexHTML(reports),
    'utf8'
  );

  console.log(
    `\n\x1b[32m✔\x1b[0m Combined coverage index generated at: ${path.join(OUTPUT_DIR, 'index.html')}\n`,
  );
}

main();
