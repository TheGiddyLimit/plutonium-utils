import fs from "fs";
import path from "path";
import {readJsonSync} from "./Kludge.js";
import {ClassicLevel} from "classic-level";

const DIR_PACKS = "./packs";
const META_FILENAME = "_meta.json";

// TODO(Future) expand as required
const DOC_TYPE_TO_KEY_NAME = {
	"Actor": "actors",

	"Item": "items",

	"Macro": "macros",

	"JournalEntry": "journal",
	"JournalEntryPage": "pages",

	"RollTable": "tables",
	"TableResult": "results",

	"ActiveEffect": "effects",
};

const mutDocumentJson = (
	{
		dirpath,
		fname,
		json,
		packMeta,
	},
) => {
	switch (packMeta.type) {
		case "Macro": {
			const pathScript = path.join(dirpath, fname.replace(/\.json$/, ".js"));
			if (fs.existsSync(pathScript)) json.command = fs.readFileSync(pathScript, "utf-8");

			break;
		}
	}
};

const pWritePack = async (
	{
		dir,
		packMeta,
		jsons,
	},
) => {
	const dbOpts = {valueEncoding: "json", keyEncoding: "utf-8"};

	const db = new ClassicLevel(path.join(dir, packMeta.path), dbOpts);
	const batch = db.batch();

	// TODO(Future) support nested entities, e.g. items/effects on actors
	for (const json of jsons) {
		const key = `!${DOC_TYPE_TO_KEY_NAME[packMeta.type]}!${json._id}`;
		batch.put(key, json);
	}

	await batch.write();
	await db.close();
};

export default async (
	{
		dir,
		isLevelsPacks,
		packSystem = "dnd5e",
	},
) => {
	if (!isLevelsPacks) return;

	if (!fs.existsSync(DIR_PACKS)) return;

	console.log("Building packs ...");

	const packs = [];
	for (const dirname of fs.readdirSync(DIR_PACKS)) {
		const dirpath = path.join(DIR_PACKS, dirname);

		if (!fs.statSync(dirpath).isDirectory()) continue;

		const metaJson = readJsonSync(path.join(dirpath, META_FILENAME));
		if (!metaJson) continue;

		const packMeta = {
			...metaJson,
			"name": dirname,
			"path": `packs/${dirname}`,
			"system": packSystem,
		};

		const jsonFnames = fs.readdirSync(dirpath)
			.filter(fname => fname !== META_FILENAME && fname.endsWith(".json"));

		if (!jsonFnames.length) continue;

		const jsons = jsonFnames.map(fname => {
			const json = readJsonSync(path.join(dirpath, fname));

			mutDocumentJson({dirpath, fname, json, packMeta});

			return json;
		});

		if (!jsons.length) continue;

		await pWritePack({dir, packMeta, jsons});

		packs.push(packMeta);
	}

	return packs.length ? packs : undefined;
};
