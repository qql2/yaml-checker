/* eslint-disable prefer-const */
import { MarkdownView, Modal, Notice, Plugin, TFile, parseYaml } from 'obsidian';

// Remember to rename these classes and interfaces!

interface Settings {
	mySetting: string;
}

const DEFAULT_SETTINGS: Settings = {
	mySetting: 'default'
}

export default class YAML_CHECKER extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'check all YAML format',
			name: 'Check the YAML format in all the markdowns',
			callback: async () => {
				let filesWithError: { file: TFile; error: Error }[] = [];

				for (let file of this.app.vault.getMarkdownFiles()) {
					try {
						await this.getYAML(file);
					} catch (error) {
						filesWithError.push({ file, error });
					}
				}

				if (filesWithError.length > 0) {
					new Notice(`Found ${filesWithError.length} markdown files with invalid YAML format`);
					console.log(filesWithError);
					this.showError(filesWithError);
				} else {
					new Notice('All markdown files have valid YAML format');
				}
			}
		});
	}
	showError(filesWithError: { file: TFile; error: Error; }[]) {
		let errorList = new Modal(this.app);
		errorList.onOpen = () => {
			let { contentEl } = errorList;
			contentEl.createEl('h2', { text: 'Invalid YAML format' });
			let list = contentEl.createEl('ul');
			for (let { file, error } of filesWithError) {
				let listItem = list.createEl('li');
				listItem.createEl('a', { text: file.path, attr: { href: `obsidian://open?vault=${encodeURIComponent(file.vault.getName())}&file=${encodeURIComponent(file.path)}` } });
				listItem.createEl('p', { text: error.message });
			}
		};
		errorList.open();
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}

	async getYAML(file: TFile): Promise<any> {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!markdownView) {
			throw new Error('No markdown view is active');
		}

		const editor = markdownView.editor;
		const yaml = parseYaml(editor.getValue());

		if (!yaml) {
			throw new Error(`Invalid YAML format in file ${file.path}`);
		}

		return yaml;
	}
}
