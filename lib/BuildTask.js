import * as fs from "fs";
import * as kludge from "./Kludge.js";
import buildMacros from "./BuildMacrosTask.js";

const packageJson = JSON.parse(fs.readFileSync(`./package.json`, "utf-8"));

const _getModuleJson = (
	{
		name,
		title,
		description,
		dependencies,
		esmodules,
		styles,
		authors,
		license = "UNLICENSED",
		bugs,
		system,
	},
) => ({
	name,
	title,
	description,
	"version": packageJson.version,
	"authors": authors || [
		{
			"name": "Giddy",
			"url": "https://www.patreon.com/Giddy5e",
			"discord": "Giddy#0001",
		},
	],
	"readme": "README.md",
	license,
	bugs,
	"compatibleCoreVersion": "9",
	"url": "https://www.patreon.com/Giddy5e",
	"dependencies": dependencies,
	system,
	esmodules,
	styles,
	"packs": [
		...fs.readdirSync(`./packs/`).filter(it => it.endsWith(".db")).map(it => ({
			"name": it.split(".")[0],
			"label": it.split("").map((char, i) => i === 0 ? char.toUpperCase() : char).join("").split(".")[0],
			"system": "dnd5e",
			"path": `./packs/${it}`,
			"type": it === "creatures.db" ? "Actor" : it === "macros.db" ? "Macro" : "Item",
		})),
	],
});

const doBuild = async (opts) => {
	const {dir} = opts;

	const timeStart = Date.now();

	console.log("Wiping dist...");
	kludge.removeSync(dir);

	console.log(`Packaging v${packageJson.version}...`);

	buildMacros(opts);

	// region TODO allow these dirs/etc. to be specified externally
	console.log(`Adding packs...`);
	kludge.copySync(`./packs`, `${dir}/packs`);

	console.log(`Adding README...`);
	kludge.copySync(`./MODULE_README.md`, `${dir}/README.md`);
	// endregion

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
