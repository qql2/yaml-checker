/* eslint-disable prefer-const */
import { Modal, Notice, Plugin, TFile, parseYaml } from "obsidian";

import { YAML } from "qql1-yaml";
import { parse, parseDocument } from "yaml";

// Remember to rename these classes and interfaces!

interface Settings {
	mySetting: string;
}

const DEFAULT_SETTINGS: Settings = {
	mySetting: "default",
};

export default class YAML_CHECKER extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "check all YAML format",
			name: "Check the YAML format in all the markdowns",
			callback: async () => {
				let filesWithError: { file: TFile; error: Error }[] = [];

				for (let file of this.app.vault.getMarkdownFiles()) {
					try {
						await this.parseYAML(file);
					} catch (error) {
						filesWithError.push({ file, error });
					}
				}

				if (filesWithError.length > 0) {
					new Notice(
						`Found ${filesWithError.length} markdown files with invalid YAML format`
					);
					console.log(filesWithError);
					this.showError(filesWithError);
				} else {
					new Notice("All markdown files have valid YAML format");
				}
			},
		});
	}
	showError(filesWithError: { file: TFile; error: Error }[]) {
		let errorList = new Modal(this.app);
		errorList.onOpen = () => {
			let { contentEl } = errorList;
			contentEl.createEl("h2", { text: "Invalid YAML format" });
			let list = contentEl.createEl("ul");
			for (let { file, error } of filesWithError) {
				let listItem = list.createEl("li");
				listItem.createEl("a", {
					text: file.path,
					attr: {
						href: `obsidian://open?vault=${encodeURIComponent(
							file.vault.getName()
						)}&file=${encodeURIComponent(file.path)}`,
					},
				});
				listItem.createEl("p", { text: error.message });
			}
		};
		errorList.open();
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}

	async parseYAML(file: TFile): Promise<any> {
		let yaml = await this.GetYAMLtxt(file, this);
		if (!yaml) return null;
		parse(yaml);
	}
	async getYAMLPos(file: TFile, plugin: Plugin) {
		const doc = await plugin.app.vault.read(file);
		const hasYAMLRgx = /(^---\n)(.)*?(\n?---(\n|$))/gs;
		let hasYAML = false;
		let str = "";
		let index = 4;
		doc.replace(hasYAMLRgx, (word, ...arg) => {
			hasYAML = true;
			if (word) str = word;
			index = arg.slice(-2)[0];
			return word;
		});
		const FinalLineOffset = str.length - 1 + index;
		if (!hasYAML) return null;
		return { start: 4, end: FinalLineOffset - 4 };
	}
	async GetYAMLtxt(file: TFile, plugin: Plugin) {
		let yamlPos = await this.getYAMLPos(file, plugin);
		if (!yamlPos || yamlPos.end - yamlPos.start == -1) return "";
		const txt = (await plugin.app.vault.read(file)).slice(
			yamlPos.start,
			yamlPos.end + 1
		);
		return txt;
	}
}
