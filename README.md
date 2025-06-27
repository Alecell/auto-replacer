# 🪄 Auto Replacer – Obsidian Plugin

Auto Replacer is a powerful plugin for [Obsidian](https://obsidian.md) that automatically replaces text in your notes using custom rules powered by **regex** and **JavaScript**.

Whether you want to format units, highlight keywords, or inject smart, context-aware replacements like the note title, Auto Replacer gives you full control over text automation in your vault.

---

## 📦 Features

-   👀 Define your own **Regex patterns**
-   🧠 Write **JavaScript transform functions** to control how matches are replaced
-   💾 Rules are **saved and editable** via a visual UI
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

| Name                  | Text           | Pattern                                     | Replace With         |
| --------------------- | -------------- | ------------------------------------------- | -------------------- |
| Replace Note Title    | world of pados | `(?<!\*\*)\b{{file.basename}}\b(?!\*\*)`    | `**World of Pados**` |
| Replace Comma Decimal | 27,6           | `\b\d+,\d+\b`                               | `27.6`               |
| Replace Fahrenheit    | 64.4 °F        | `\b\d+(\.\d+)?\s?°?\s?F\b`                  | `18 °C`              |
| Emphasize Measurement | 49 km          | `\b\d+(?:\.\d+)?\s\*(?:km\|mi\|kg\|g\|m)\b` | `*49 km*`            |

---

## 📘 How to Use

1. Open **Settings → Auto Replacer**
2. Click "Add custom rule"
3. Fill out:

    - `Rule name`
    - `Rule ID`
    - `Regex pattern` and Flags
    - `Replacement code` (in JavaScript)
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

#### 🛑 Only Run Code You Understand

The Auto Replacer plugin allows you to write and execute custom JavaScript functions to dynamically transform matched content within your notes. These functions are executed locally, directly in your Obsidian vault, and are never transmitted anywhere.

However, executing arbitrary code — even if it looks innocent — can have unintended consequences. You have full control over what the plugin runs, which also means you take full responsibility for what it does. A simple typo can break your notes. A badly written loop can slow down your editor. And a malicious snippet (if ever copied from somewhere) could do far worse.

So please — only run code that you fully understand.

Auto Replacer offers you the power to automate and enhance your note-taking...
But as a certain wise uncle once said:

> With great power comes great responsibility.

---

## 📚 Documentation

| Section          | Link                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Learn More       | [📚 Documentation](https://github.com/Alecell/auto-replacer/blob/master/DOCUMENTATION.md) |
| Plugin on GitHub | [🔗 GitHub Repo](https://github.com/Alecell/auto-replacer)                                |
| Submit Issue     | [🐛 Report](https://github.com/Alecell/auto-replacer/issues/new)                          |

---

## 🐉 Support the Plugin – Buy Me a Dragon

Creating and maintaining this plugin takes time, research, and a lot of coffee (or should I say... dragons?).  
If you found AutoReplacer useful and want to support its development, consider fueling it with a mythical boost!

[![Buy Me a Dragon](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/alecell)

Your support helps improve the plugin and means a lot 💛

---

## 👥 Credits

Created with ❤️ by Alecell. Special thanks to sailKite!

---

## 📃 License

MIT License © Alecell
