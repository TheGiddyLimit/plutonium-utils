import fs from "fs";
import path from "path";

import { compilePack } from "@foundryvtt/foundryvtt-cli";
import {DIR_PACKS, DIR_PACKS_SOURCE, isMacroKey} from "./UtilsPack.js";

const doBuildPacks = async ({id, packSystem}) => {
	const packSourceDirs = fs
		.readdirSync(DIR_PACKS_SOURCE, {withFileTypes: true})
		.map(fileInfo => ({
			name: fileInfo.name,
			dirpath: path.join(fileInfo.parentPath, fileInfo.name),
		}))
		.filter(({dirpath}) => fs.statSync(dirpath).isDirectory());

	const out = [];
	for (const {name, dirpath} of packSourceDirs) {
		const dirpathOut = path.join(DIR_PACKS, name);

		// TODO(Future; Doctype) support other document types
		const type = "Macro";
		if (["Actor", "Item", "Adventure"].includes(type) && !packSystem) throw new Error(`Actor/Item/Adventure compendiums must specify their system! (see: https://github.com/foundryvtt/foundryvtt/issues/7636)`);

		console.log(`Building compendium pack "${name}"`);
		console.group();
		await compilePack(dirpath, dirpathOut, {
			clean: true,
			log: true,
			recursive: true,
			transformEntry: entry => {
				// TODO(Future; Doctype) support other document types
				if (!isMacroKey(entry._key)) return;

				const {command_source} = entry;
				entry.command = fs.readFileSync(command_source, "utf-8");
				delete entry.command_source;
				console.log(`Packed ${command_source}`);
			},
		});
		console.groupEnd();

		out.push({
			name: name,
			label: name.split("").map((char, i) => i === 0 ? char.toUpperCase() : char).join("").split(".")[0],
			path: `packs/${name}`,
			module: id,
			...(packSystem ? {system: packSystem} : {}),
			type,
		});
	}

	return out;
};

export default doBuildPacks;
