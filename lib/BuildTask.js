import * as fs from "fs";
import * as kludge from "./Kludge.js";
import buildMacros from "./BuildMacrosTask.js";
import pBuildPacksLevelsTask from "./BuildPacksLevelsTask.js";

const packageJson = JSON.parse(fs.readFileSync(`./package.json`, "utf-8"));

const getPacks = (
	{
		packSystem = "dnd5e",
	},
) => {
	return fs.existsSync(`./packs/`)
		? [
			...fs.readdirSync(`./packs/`)
				.filter(it => it.endsWith(".db"))
				.map(it => {
					const type = it === "creatures.db" ? "Actor" : it === "macros.db" ? "Macro" : "Item";
					const out = {
						"name": it.split(".")[0],
						"label": it.split("").map((char, i) => i === 0 ? char.toUpperCase() : char).join("").split(".")[0],
						"system": !packSystem ? undefined : packSystem,
						"path": `./packs/${it}`,
						"type": type,
					};
					if (["Actor", "Item", "Adventure"].includes(type) && !out.system) throw new Error(`Actor/Item/Adventure compendiums must specify their system! (see: https://github.com/foundryvtt/foundryvtt/issues/7636)`);
					return out;
				}),
		]
		: undefined;
};

const _getModuleJson = (
	{
		id,
		name,
		title,
		description,
		version,
		dependencies, // v9
		esmodules,
		scripts,
		styles,
		authors,
		keywords,
		license = "UNLICENSED",
		manifest,
		download,
		bugs,
		changelog,
		relationships, // v10
		system, // v9
		minimumCoreVersion, // v9
		compatibleCoreVersion, // v9
		compatibility, // v10
		url = "https://www.patreon.com/Giddy5e",
		languages,
		flags,
		socket,
		persistentStorage,
		documentTypes,
	},
	{
		packs,
	} = {},
) => {
	// v10+ uses "id" rather than "name"; support both until we drop support for v9-
	id = id || name;
	version = version || packageJson.version;

	return {
		id,
		name,
		title,
		description,
		version,
		authors: authors || [
			{
				"name": "Giddy",
				"url": "https://www.patreon.com/Giddy5e",
				"discord": "giddy_",
				"flags": {
					"patreon": "Giddy5e",
					"github": "TheGiddyLimit",
				},
			},
		],
		keywords,
		readme: "README.md",
		license,
		bugs,
		changelog,
		url,
		manifest,
		download,
		minimumCoreVersion,
		compatibleCoreVersion,
		compatibility,
		socket,
		persistentStorage,
		esmodules,
		scripts,
		styles,
		packs,
		languages,
		dependencies,
		relationships,
		system,
		documentTypes,
		flags,
	};
};

const doBuild = async (opts) => {
	const {
		dir,
		moduleDir = "./module",
		dirsModuleInclude,
		dirsModuleIgnore,
		version,
		additionalFiles,
		additionalDirectories,
		isQuiet,
		persistentStorage,
		isLevelsPacks = false,
	} = opts;
	const dirsModuleIncludeSet = dirsModuleInclude != null ? new Set(dirsModuleInclude) : null;
	const dirsModuleIgnoreSet = new Set([...dirsModuleIgnore || [], "scss"]);

	const timeStart = Date.now();

	if (!isQuiet) console.log("Wiping dist...");
	kludge.removeSync(dir);

	if (!isQuiet) console.log(`Packaging v${version || packageJson.version}...`);

	buildMacros(opts);

	const packs = isLevelsPacks ? await pBuildPacksLevelsTask(opts) : getPacks(opts);

	([...(additionalFiles || []), ...(additionalDirectories || [])])
		.forEach(({name, pathIn, pathOut}) => {
			if (!isQuiet) console.log(`Adding ${name || pathIn}...`);
			kludge.copySync(pathIn, `${dir}/${pathOut || pathIn}`);
		});

	if (moduleDir != null) {
		console.log(`Adding module directories...`);
		fs.readdirSync(moduleDir)
			.filter(it => !dirsModuleIgnoreSet.has(it) && (dirsModuleIncludeSet == null || dirsModuleIncludeSet.has(it)))
			.forEach(it => {
				if (!isQuiet) console.log(`Adding contents of "${it}" directory...`);
				kludge.copySync(`${moduleDir}/${it}`, `${dir}/${it}`);
			});
	}

	// Workaround to ensure a `storage` dir is present if `persistentStorage` is set
	// See: https://github.com/foundryvtt/foundryvtt/issues/9274
	if (persistentStorage) fs.mkdirSync(`${dir}/storage`, {recursive: true});

	if (!isQuiet) console.log(`Adding "module.json"...`);
	const moduleJson = _getModuleJson(opts, {packs});
	fs.mkdirSync(dir, {recursive: true});
	fs.writeFileSync(`${dir}/module.json`, JSON.stringify(moduleJson, null, "\t"), "utf-8");

	console.log(`Build completed in ${((Date.now() - timeStart) / 1000).toFixed(2)} secs`);
};

export default doBuild;
