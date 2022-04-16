import * as fs from "fs";
import * as kludge from "./kludge.js";

const DIR_MACROS = "macro";
const PATH_OUT = `./packs/macros.db`;

export default () => {
	if (!fs.existsSync(DIR_MACROS)) return;

	console.log("Building macros.db ...");

	const errors = [];

	const macroJsons = fs.readdirSync(DIR_MACROS)
		.filter(it => it.endsWith(".json"))
		.map(filename => {
			const metaPath = `${DIR_MACROS}/${filename}`;
			const meta = kludge.readJsonSync(metaPath);
			const commandPath = `${DIR_MACROS}/${meta.commandSource}`;
			const scriptRaw = fs.readFileSync(commandPath, "utf-8");

			if (meta.isIgnored) return null;

			if (!meta.id) {
				errors.push(`Macro "${meta.name}" did not have an "id"! Use this randomly generated one: ${kludge.getRandomFoundryUid()}`);
				return;
			}

			// Support includes of the form `// include: <filename.js>`
			const script = scriptRaw.replace(/^(?<prefix>\s*)\/\/ include: (?<inclusion>.*)$/gm, (...m) => {
				const groups = m.slice(-1)[0];

				return fs.readFileSync(`${DIR_MACROS}/${groups.inclusion.trim()}`, "utf-8")
					.split("\n")
					.map(it => `${groups.prefix}${it}`)
					.join("\n");
			});

			return {
				name: meta.name,
				type: meta.type || "script",
				img: meta.img,
				scope: meta.scope || "global",
				command: script,
				folder: null,
				sort: 0,
				permission: {default: 0},
				_id: meta.id,
			};
		})
		.filter(Boolean);

	if (errors.length) {
		console.error(errors.join("\n"));
		process.exit(1);
	}

	const outData = macroJsons.map(it => JSON.stringify(it)).join("\n");

	fs.writeFileSync(PATH_OUT, outData, "utf-8");

	console.log("Built macros.db");
};
