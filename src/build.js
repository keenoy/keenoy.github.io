import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";


// --------------------------------------------------
// Paths
// --------------------------------------------------

const LOCALES = ["ko", "en"];
const ROOT = process.cwd();

const CONTENTS_DIR = path.join(ROOT, "contents");
const PROFILE_DIR = path.join(CONTENTS_DIR, "profile");
const PORTFOLIOS_DIR = path.join(CONTENTS_DIR, "portfolios");

const PUBLIC_DIR = path.join(ROOT, "public");
const DIST_DIR = path.join(ROOT, "docs");


// --------------------------------------------------
// File utilities
// --------------------------------------------------

function readText(filePath) {
	return fs.readFileSync(filePath, "utf8");
}

function readYaml(filePath) {
	const text = readText(filePath);
	return YAML.parse(text);
}

function writeText(filePath, text) {
	fs.writeFileSync(filePath, text, "utf8");
}

function getYamlFiles(directory) {
	return fs
		.readdirSync(directory)
		.filter(file => file.endsWith(".yaml"))
		.sort();
}


// --------------------------------------------------
// Content loading
// --------------------------------------------------
function loadLocale(locale) {
	const profile = readYaml(path.join(PROFILE_DIR, locale + ".yaml"));
	const portfolios = loadPortfolios(locale);

	return {
		profile,
		portfolios
	};
}

function loadPortfolios(locale) {
	var subdirs = fs.readdirSync(PORTFOLIOS_DIR, { withFileTypes: true })
		.filter(p => p.isDirectory())
		.sort(p => p.name);
	return subdirs.map(dir => {
		const filePath = path.join(PORTFOLIOS_DIR, dir.name, locale + ".yaml");
		return readYaml(filePath);
	});
}


// --------------------------------------------------
// HTML helpers
// --------------------------------------------------

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function renderLinks(links) {
	if (!links || links.length === 0) {
		return "";
	}

	return `
        <div class="links">
            ${links.map(link => `
                <a
                    href="${escapeHtml(link.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
					<img src="${escapeHtml(link.icon)}"/>
                </a>
            `).join("")}
        </div>
    `;
}

// --------------------------------------------------
// Section rendering
// --------------------------------------------------

function renderProfile(profile) {
	return `
        <section class="profile">
			<img src="${escapeHtml(profile.image)}"/>
			<div class="info">
				<h2 class="name">${profile.name}</h2>
				<p class="desc">${profile.desc}</p>
				${renderLinks(profile.links)}
			</div>
        </section>
    `;
}

function renderPortfolio(portfolio) {
	return `
        <article class="portfolio">
            <h2>${escapeHtml(portfolio.title)}</h2>
			<div class="portfolio-status">
				<span class="status ${escapeHtml(portfolio.status)}">${escapeHtml(portfolio.status)}</span>
				${renderPlatforms(portfolio.platforms)}
			</div>
			<div class="portfolio-description">
                ${portfolio.desc}
            </div>
			${renderImages(portfolio.images)}
        </article>
    `;
}

function renderImages(images) {
	if (!images || images.length === 0) {
		return "";
	}

	return `
        <div class="portfolio-images">
            ${images.map(image => `
                <img
                    src="${escapeHtml(image)}"
                    alt=""
                >
            `).join("")}
        </div>
    `;
}

function renderPlatforms(platforms) {
	if (!platforms || platforms.length === 0) {
		return "";
	}

	return `
		<div class="platforms">
		${platforms.map(platform => `
			<a class="platform" href="${platform.url}" title="${platform.name}">
				<img src="${escapeHtml(platform.image)}"/>
			</a>
		`).join("")}
		</div>
    `;
}


// --------------------------------------------------
// Complete page
// --------------------------------------------------

function renderPage(profile, portfolios, locale) {
	return `<!doctype html>
<html land=${locale}>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(profile.name)}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Stardos+Stencil:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../style.css">
	<script>
		localStorage.setItem("lang", "${locale}");
	</script>
</head>

<body>
	<header>
		${LOCALES.map(locale => `<a href="../${locale}">${locale}</a>`).join(" | ")}
	</header>
    <main>
        ${renderProfile(profile)}
        <section class="portfolio-list">
            ${portfolios.map(renderPortfolio).join("")}
        </section>
    </main>
	<footer>
		<a href="privacy-policy.html">PRIVACY POLICY</a>
	</footer>
</body>
</html>
`;
}


// --------------------------------------------------
// Build
// --------------------------------------------------

function copyPublicFiles() {
	fs.cpSync(
		PUBLIC_DIR,
		DIST_DIR,
		{
			recursive: true
		}
	);
}

function buildLocale(locale) {
	const content = loadLocale(locale);
	const html = renderPage(content.profile, content.portfolios, locale);
	const outputDir = path.join(DIST_DIR, locale);

	fs.mkdirSync(outputDir, {
		recursive: true
	});

	writeText(
		path.join(outputDir, "index.html"),
		html
	);
}

function build() {
	console.log("Building website...");
	fs.rmSync(DIST_DIR, {
		recursive: true,
		force: true
	});
	for (const locale of LOCALES) {
		buildLocale(locale);
	}
	copyPublicFiles();
	console.log("Build complete.");
}

build();