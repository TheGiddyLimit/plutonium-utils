import * as fs from "fs";
import * as kludge from "./Kludge.js";
import buildMacros from "./BuildMacrosTask.js";

const packageJson = JSON.parse(fs.readFileSync(`./package.json`, "utf-8"));

const _getModuleJson = (
	{
		id,
		name,
		title,
		description,
		dependencies, // v9
		esmodules,
		scripts,
		styles,
		authors,
		license = "UNLICENSED",
		manifest,
		download,
		bugs,
		relationships, // v10
		system, // v9
		packSystem = "dnd5e",
		minimumCoreVersion, // v9
		compatibleCoreVersion, // v9
		compatibility, // v10
		url = "https://www.patreon.com/Giddy5e",
		languages,
		flags,
		socket,
	},
) => {
	// v10+ uses "id" rather than "name"; support both until we drop support for v9-
	id = id || name;

	const packs = fs.existsSync(`./packs/`)
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

	return {
		id,
		name,
		title,
		description,
		"version": packageJson.version,
		"authors": authors || [
			{
				"name": "Giddy",
				"url": "https://www.patreon.com/Giddy5e",
				"discord": "Giddy#0001",
				"flags": {
					"patreon": "Giddy5e",
					"github": "TheGiddyLimit",
				},
			},
		],
		"readme": "README.md",
		license,
		manifest,
		download,
		bugs,
		minimumCoreVersion,
		compatibleCoreVersion,
		compatibility,
		url,
		dependencies,
		relationships,
		system,
		esmodules,
		scripts,
		styles,
		packs,
		languages,
		flags,
		socket,
	};
};

const doBuild = async (opts) => {
	const {dir, additionalFiles} = opts;

	const timeStart = Date.now();

	console.log("Wiping dist...");
	kludge.removeSync(dir);

	console.log(`Packaging v${packageJson.version}...`);

	buildMacros(opts);

	(additionalFiles || []).forEach(({name, pathIn, pathOut}) => {
		console.log(`Adding ${name || pathIn}...`);
		kludge.copySync(pathIn, `${dir}/${pathOut || pathIn}`);
	});

	console.log(`Adding module directories...`);
	fs.readdirSync("./module/")
		.filter(it => it !== "scss") // TODO allow ignored dirs to be specified externally
		.forEach(it => {
			console.log(`Adding contents of "${it}" directory...`);
			kludge.copySync(`./module/${it}`, `${dir}/${it}`);
		});

	console.log(`Adding "module.json"...`);
	const moduleJson = _getModuleJson(opts);
	fs.writeFileSync(`${dir}/module.json`, JSON.stringify(moduleJson, null, "\t"), "utf-8");

	console.log(`Build completed in ${((Date.now() - timeStart) / 1000).toFixed(2)} secs`);
};

export default doBuild;
