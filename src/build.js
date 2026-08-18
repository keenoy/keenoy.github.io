import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";


// --------------------------------------------------
// Paths
// --------------------------------------------------

const LOCALES = ["ko", "en"];
const ROOT = process.cwd();

const CONTENTS_DIR = path.join(ROOT, "contents");

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
	const contentDir = path.join(CONTENTS_DIR, locale);

	const profile = readYaml(
		path.join(contentDir, "profile.yaml")
	);

	const portfolios = loadPortfolios(
		path.join(contentDir, "portfolios")
	);

	return {
		profile,
		portfolios
	};
}

function loadPortfolios(portfolios_dir) {
	const files = getYamlFiles(portfolios_dir);

	return files.map(file => {
		const filePath = path.join(portfolios_dir, file);
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
				<h2 class="name">${escapeHtml(profile.name)}</h2>
				<p class="desc">${escapeHtml(profile.desc)}</p>
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

function renderPage(profile, portfolios) {
	return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(profile.name)}</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Stardos+Stencil:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../style.css">
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

	const html = renderPage(
		content.profile,
		content.portfolios
	);

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