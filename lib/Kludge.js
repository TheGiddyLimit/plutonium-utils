// TODO(Future) junk copy-pastes from S.O.; replace this with `fs-extra` when those monkeys pull their finger out
//   and support ESM modules.
//   See: https://github.com/jprichardson/node-fs-extra/issues/746

import * as fs from "fs";
import * as path from "path";

function removeSync (path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(file => {
			const curPath = `${path}/${file}`;
			if (fs.lstatSync(curPath).isDirectory()) removeSync(curPath);
			else fs.unlinkSync(curPath);
		});
		fs.rmdirSync(path);
	}
}

/**
 * @param src
 * @param dest
 * @param [opts]
 * @param [opts.isForce]
 * @param [opts.isDryRun]
 */
function copySync (src, dest, opts) {
	opts = opts || {};
	if (fs.existsSync(src) && fs.statSync(src).isDirectory()) {
		if (opts.isDryRun) console.log(`Creating directory ${dest}`);
		else fs.mkdirSync(dest, {recursive: true});

		fs.readdirSync(src).forEach(child => copySync(`${src}/${child}`, `${dest}/${child}`, opts));
	} else {
		if (opts.isForce) {
			if (opts.isDryRun) {
				console.log(`\tRemoving ${dest}`);
			} else {
				if (fs.existsSync(dest)) fs.unlinkSync(dest);
			}
		}

		if (opts.isDryRun) console.log(`\tCopying ${src} to ${dest}`);
		else {
			const dirName = path.dirname(dest);
			if (dirName && !fs.existsSync(dirName)) fs.mkdirSync(dirName, {recursive: true});
			fs.copyFileSync(src, dest);
		}
	}
}

function lsRecursiveSync (dir, fileList = []) {
	fs.readdirSync(dir).forEach(file => {
		fileList = fs.statSync(path.join(dir, file)).isDirectory()
			? lsRecursiveSync(path.join(dir, file), fileList)
			: fileList.concat(path.join(dir, file));
	});
	return fileList;
}

function readJsonSync (filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJsonSync (filePath, data) {
	return fs.writeFileSync(filePath, JSON.stringify(data, null, "\t"), "utf-8");
}

function pDelay (time) {
	return new Promise(resolve => setTimeout(() => resolve(), time));
}

function doLoadVetoolsUtils () {
	// FIXME(Future) when we convert 5etools to modules, import this properly
	const parserFile = fs.readFileSync("./module/ve-js/parser.js", "utf-8");
	const utilFile = fs.readFileSync("./module/ve-js/utils.js", "utf-8");
	// eslint-disable-next-line no-new-func
	Function(`${parserFile};\n${utilFile}`)();
}

/** Copied `foundry.utils.randomID */
function getRandomFoundryUid (length = 16) {
	const rnd = () => Math.random().toString(36).substr(2);
	let id = "";
	while (id.length < length) id += rnd();
	return id.substr(0, length);
}

export {
	removeSync,
	copySync,
	lsRecursiveSync,
	readJsonSync,
	writeJsonSync,
	pDelay,
	doLoadVetoolsUtils,
	getRandomFoundryUid,
};
