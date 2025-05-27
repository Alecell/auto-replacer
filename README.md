# 🪄 Auto Replacer – Obsidian Plugin

Auto Replacer is a powerful plugin for [Obsidian](https://obsidian.md) that automatically replaces text in your notes based on custom rules using **regex** and **JavaScript**.

Whether you want to format units, emphasize keywords, or inject smart context-aware replacements (like the note title), Auto Replacer gives you full control over text automation inside your vault.

---

## 📦 Features

-   👀 Define your own **Regex patterns**
-   🧠 Write **JavaScript transform functions** to control how matches are replaced
-   💾 Rules are **saved and editable** via a visual UI
-   🚫 Automatically avoids infinite loops or redundant replacements
-   ✨ No need to edit markdown manually or click on a button, just type and Auto Replacer will do the rest

---

## 🛠️ How it Works

Each rule consists of:

1. **Regex Pattern** – What you want to match (e.g., `\bkm\b`)
2. **Transform Function** – How to replace it (e.g., `*kilometers*`)
3. **Trigger** – Runs automatically on editor change, with debounce to prevent performance issues

Example:

```js
// Match the note title and make it bold
function transformNoteTitle(occurrence, editor, file) {
	const noteName = file?.basename;
	if (!noteName) return occurrence.original;
	return `**${noteName}**`;
}
```

---

## 📋 Example Rules

| Name               | Pattern                                  | Replace With   |     |     |     |     |     |
| ------------------ | ---------------------------------------- | -------------- | --- | --- | --- | --- | --- |
| Replace Note Title | `(?<!\*\*)\b{{file.basename}}\b(?!\*\*)` | `**NoteName**` |     |     |     |     |     |
| Bold Narym         | `(?<!\*\*)\bnarym\b(?!\*\*)`             | `**Narym**`    |     |     |     |     |     |

---

## 📘 How to Use

1. Open **Settings → Auto Replacer**
2. Click "Add Custom Rule"
3. Fill out:

    - `Rule Name`
    - `Rule ID`
    - `Regex Pattern` and Flags
    - `Replacement Code` (in JavaScript)
    - `Description` (optional)

4. Save and type in any note — the rule applies automatically

---

## 🧠 Advanced Usage

-   You can reference `editor` and `file` objects inside your transform code
-   Use `{{file.basename}}` as a dynamic variable in regex patterns
-   Debounce is automatically applied on `editor-change` for performance

---

## 🚨 Limitations & Considerations

-   Avoid writing transform functions that return unchanged text since it may cause unnecessary loops
-   Despite the fact that I tested it with book-size notes without problems, it also have a concern when we have too many patterns found on the same file without reasonable gaps between them, but since the word _hobbit_ is mentioned only 400 times on LOtR I _think_ it'll not be a problem.

---

## 📚 Documentation

| Section          | Link                                             |
| ---------------- | ------------------------------------------------ |
| Plugin on GitHub | [🔗 GitHub Repo](https://github.com/your-repo)   |
| FAQ              | [❓ FAQ](https://github.com/your-repo#faq)       |
| Submit Issue     | [🐛 Report](https://github.com/your-repo/issues) |

---

## 👥 Credits

Created with ❤️ by Alecell. Special thanks to sailKite!

---

## 📃 License

MIT License © Alecell
