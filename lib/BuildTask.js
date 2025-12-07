import * as fs from "fs";
import * as kludge from "./Kludge.js";
import {DIR_PACKS, DIR_PACKS_SOURCE} from "./UtilsPack.js";
import doBuildPacks from "./BuildPacksTask.js";

const packageJson = JSON.parse(fs.readFileSync(`./package.json`, "utf-8"));

const pGetPacks = async (
	{
		id,
		packSystem = "dnd5e",
	},
) => {
	if (!fs.existsSync(DIR_PACKS_SOURCE)) return [];

	return doBuildPacks({id, packSystem});
};

const _getModuleJson = (
	{
		id,
		name,
		title,
		description,
		version,
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
		relationships,
		compatibility,
		url = "https://www.patreon.com/Giddy5e",
		languages,
		flags,
		socket,
		persistentStorage,
		media,
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
		compatibility,
		socket,
		persistentStorage,
		esmodules,
		scripts,
		styles,
		packs,
		languages,
		relationships,
		media,
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
	} = opts;
	const dirsModuleIncludeSet = dirsModuleInclude != null ? new Set(dirsModuleInclude) : null;
	const dirsModuleIgnoreSet = new Set([...dirsModuleIgnore || [], "scss"]);

	const timeStart = Date.now();

	if (!isQuiet) console.log("Wiping dist...");
	kludge.removeSync(dir);

	if (!isQuiet) console.log(`Packaging v${version || packageJson.version}...`);

	const packs = await pGetPacks(opts);

	([
		...(additionalFiles || []),
		...(additionalDirectories || []),
		...packs
			.map(pack => {
				return {
					name: pack.label,
					pathIn: `${DIR_PACKS}/${pack.name}`,
					pathOut: pack.path,
				};
			}),
	])
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
