# 📚 Auto Replacer — Documentation

| Field                          | Description                                                |
| ------------------------------ | ---------------------------------------------------------- |
| **Rule name**                  | A descriptive name (used in the UI)                        |
| **Rule ID**                    | Unique identifier, lowercase only (`a-z`, `0-9`, `_`, `-`) |
| **Regex pattern**              | Regex pattern without slashes. Supports groups.            |
| **Regex Flags**                | Default is `g`, but you can use any combination            |
| **Replacement code**           | JavaScript function receiving `(occurrence, editor, file)` |
| **Ignore frontmatter**         | Skip matches inside YAML frontmatter blocks (`---`)       |
| **Ignore tilde blocks**        | Skip matches inside tilde code blocks (`~~~`)             |
| **Ignore back quote blocks**   | Skip matches inside backtick code blocks (``` ` ```)         |
| **Ignore titles**              | Skip matches inside markdown titles (`#`, `##`, etc.)     |
| **Description (Optional)**     | Freeform text to explain the rule's purpose                |er is a plugin for [Obsidian](https://obsidian.md/) that allows you to automatically replace text inside your notes using custom **regex patterns** and **JavaScript transform functions**.

It is designed to be **powerful**, **flexible**, and **extensible**, letting you define formatting rules and apply them in real time as you type.

---

## 🔧 Features

-   Custom regex-based matching
-   Rule overrides using frontmatter
-   Advanced rule templating
-   Selective content ignoring (frontmatter, code blocks, titles)
-   Dynamic placeholders like `{{file.basename}}`, `{{editor.cursor}}`, etc.
-   Real-time transformations using JS functions
-   Visual rule management UI
-   Safe-by-default: doesn't modify anything unless a match is triggered
-   Supports multiple rules, descriptions, and custom flags

---

## ⚙️ How It Works

1. You define a **rule** with:

    - A **name**
    - A **unique ID**
    - A **regex pattern**
        - It can use the [`TFile`](https://docs.obsidian.md/Reference/TypeScript+API/TFile) as `file` and [`Editor`](https://docs.obsidian.md/Reference/TypeScript+API/Editor) as `editor` in the patterns.
    - Optional **flags** (defaults to `g`)
    - A **JavaScript function** to transform each occurrence
        - It receives three parameters [`Occurrence`](https://github.com/Alecell/auto-replacer/blob/6b0b08daedf8c575bf653b4eab72653517e61b73/src/types.ts#L1) that follows a internal plugin interface, [`Editor`](https://docs.obsidian.md/Reference/TypeScript+API/Editor) and [`TFile`](https://docs.obsidian.md/Reference/TypeScript+API/TFile)
    - A **description** for your rule to easier understand it

2. The plugin listens for `editor-change` events and ending keys such as space or enter.
3. On change, the entire note is normalized, all rules are tested, and any matches are replaced using your transform code.

---

## ✍️ Creating a Rule

The rule form includes:

| Field                      | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| **Rule name**              | A descriptive name (used in the UI)                        |
| **Rule ID**                | Unique identifier, lowercase only (`a-z`, `0-9`, `_`, `-`) |
| **Regex pattern**          | Regex pattern without slashes. Supports groups.            |
| **Regex Flags**            | Default is `g`, but you can use any combination            |
| **Ignored blocks**         | Ignore code blocks, frontmatter, tildeblocks and titles    |
| **Replacement code**       | JavaScript function receiving `(occurrence, editor, file)` |
| **Description (Optional)** | Freeform text to explain the rule’s purpose                |

### Example Replacement Function

```js
function(occurrence, editor, file) {
  return `**${occurrence.original.toUpperCase()}**`
}
```

### Example Dynamic Regex

```text
(?<!\*\*)\b{{file.basename}}\b(?!\*\*)
```

You can use dynamic references inside regex with double curly braces, like:

-   `{{file.basename}}`
-   `{{editor.lineCount()}}`

No escaping is needed. Just write it as-is.

---

## 🚀 Advanced Features

### Rule Overrides in Frontmatter

You can override your global rules on a per-file basis using the `auto-replacer` key in your note's frontmatter. This gives you granular control without changing your global settings.

```yaml
---
auto-replacer:
  rule-id-1: false          # Disables a rule
  rule-id-2: []             # Also disables a rule
  rule-id-3:
    - "{{mainRule}}"        # Uses the original global rule - Remember to use aspas here
    - new-pattern           # Adds a new word to the rule
    - /a{{file.basename}}/  # Supports regex and dynamic replacement
---
```

### Advanced Templating

Two special templates are available to make your rules more flexible.

- `{{frontmatterString}}`: This template is replaced by the exact string you've defined in the frontmatter. It's a key feature for creating formatting rules that don't cause infinite loops.
    
- `{{mainRule}}`: Use this template within an array in your frontmatter to include the global rule's pattern alongside your custom ones.
    

### How `{{frontmatterString}}` works:

You define a complex regex in your global rule that includes the `{{frontmatterString}}` placeholder. This lets you specify simple words or phrases in your frontmatter while the rule handles the full regex complexity, like checking for existing formatting.

Example:

To make a list of words bold while avoiding infinite loops:

1. Global Rule: boldify
2. Regex Pattern: `(?<!\*\*)\b{{frontmatterString}}\b(?!\*\*)`
3. Replacement Code: ```(occurence) => `**${occurrence.original}**` ```    
4. Frontmatter:
    ```yaml
    ---
    auto-replacer:
      boldify:
        - "Sonic"
        - "Dark Souls"
    ---
    ```
    
When the plugin runs, it will combine the pattern from the frontmatter with your global regex, effectively running a new, customized regex for each item on your list (e.g., `(?<!\*)\bSonic\b(?!\*)`).

<img width="538" height="266" alt="image" src="https://github.com/user-attachments/assets/17be1cfb-59ee-4e48-8586-b847c079ac1c" />

### 🚫 Ignore Options

Auto Replacer allows you to **selectively ignore** certain parts of your markdown documents where you don't want rules to be applied. This prevents unwanted formatting in code blocks, frontmatter, and other structured content.

**Available Ignore Options**

| Option                     | Description                                    | Example                           |
| -------------------------- | ---------------------------------------------- | --------------------------------- |
| **Ignore frontmatter**    | Skips YAML frontmatter blocks                 | `---`<br>`title: My Note`<br>`---` |
| **Ignore tilde blocks**   | Skips tilde code blocks                       | `~~~python`<br>`print("hello")`<br>`~~~` |
| **Ignore back quote blocks** | Skips backtick code blocks                 | ``` ` ` `js ```<br>`console.log("hi")`<br>` ``` `  |
| **Ignore titles**         | Skips markdown headings                       | `# Title`, `## Subtitle`, etc.    |

---

## ⚠️ Warnings & Limitations

### 🛑 Only Run Code You Understand

The Auto Replacer plugin allows you to write and execute custom JavaScript functions to dynamically transform matched content within your notes. These functions are executed locally, directly in your Obsidian vault, and are never transmitted anywhere.

However, executing arbitrary code — even if it looks innocent — can have unintended consequences. You have full control over what the plugin runs, which also means you take full responsibility for what it does. A simple typo can break your notes. A badly written loop can slow down your editor. And a malicious snippet (if ever copied from somewhere) could do far worse.

So please — only run code that you fully understand.

Auto Replacer offers you the power to automate and enhance your note-taking...
But as a certain wise uncle once said:

> With great power comes great responsibility.

### 🌀 Infinite Loops & Overlapping Rules

Avoid rules that re-trigger themselves or interfere with other rules. Example of bad setup:

- **Infinite Loops:** A rule that adds formatting but doesn't check for it can get stuck in an infinite loop. For example, a rule that formats "Narym" to "**Narym**" will keep re-triggering if its regex also matches "**Narym**". The `{{frontmatterString}}` template is designed to help prevent this.
    
- **Overlapping Rules:** The plugin does not handle overlapping rules gracefully. If one rule replaces a phrase and another rule targets a word within that same phrase, the results will be unpredictable. It's best to ensure each rule has a distinct search pattern.

This can cause an **infinite loop** of updates. Always test your rules thoroughly.

### ❗ JS Errors

Malformed replacement code will be silently caught, but can break the replacement logic. Always test your functions in the browser devtools first.

---

## 🧠 Pro Tips & Common Pitfalls

-   **It's easy to miss something when writing a rule:** While working on a new rule, create a test note to extensively test your logic before applying it to your actual notes (trust me — I learned this the hard way). Once your rule seems solid, copy the content of a real note into the test file and try again. Fine-tune the rule there before applying it across your vault.

-   **Your regex should avoid already-formatted content:** If your regex doesn’t account for previously applied formatting, you might trigger formatting loops. For example, if you want to match a note title `({{file.basename}})` and wrap it with `**`, use a pattern like `(?<!\*\*)\b{{file.basename}}\b(?!\*\*)` to avoid matching titles that are already bolded.

-   **You can debug your rule like any JavaScript code:** Since you're writing plain JavaScript, you can freely use `console.log()` or even `debugger`. Just open your developer console in Obsidian to inspect what's going on.

-   **This plugin is meant for auto-formatting, not auto-completion:** Auto Replacer is designed to bring visual consistency to your notes through pattern-based text formatting — not to handle hundreds of consecutive substitutions like a snippet expansion tool. Use it with moderation and intention.

---

## 💡 Examples

### 1. Highlight Note Title

**Regex Pattern:**

```text
(?<!\*\*)\b{{file.basename}}\b(?!\*\*)
```

**Function:**

```js
function(occurrence, editor, file) {
  const noteName = file?.basename;
  if (!noteName) return occurrence.original;
  return `**${noteName}**`
}
```

### 2. Emphasize Units

**Regex Pattern:**

```text
(\d+)\s*(km|m|km\/h|m\/s)
```

**Function:**

```js
function(occurrence) {
  const [_, number, unit] = occurrence.match;
  return `*${number} ${unit.toLowerCase()}*`;
}
```

---

## 🐢 Performance Notes

We have tested:

-   Files with over **5 million characters**
-   A regex with **85k+ occurrences** across the file
-   Result: **No issues** when words are spread out

However:

> If the same word (e.g., `"foo"`) is **repeated consecutively hundreds of times**, like `foo foo foo ...`, performance may degrade.

This appears to be linked to how many elements are **rendered simultaneously** on screen, not total matches.

### Recommendation:

✅ Use rules with clear boundaries
❌ Avoid mass repetition of a single word side-by-side

---

## 🔭 Under the Hood

-   Uses a **normalized** version of the text for pattern matching (stripped diacritics)
-   Applies changes using `editor.transaction()`
-   Keeps caret stable using `offsetToPos()` and `posToOffset()`
-   Dynamic paths like `{{file.extension}}` are resolved at runtime

---

## ✅ Compatibility

-   Obsidian v1.8.10+
-   Should work across all major OSs
-   Compatible with community themes (uses minimal styling)

---

## 🐉 Support the Plugin – Buy Me a Dragon

Creating and maintaining this plugin takes time, research, and a lot of coffee (or should I say... dragons?).  
If you found AutoReplacer useful and want to support its development, consider fueling it with a mythical boost!

[![Buy Me a Dragon](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/alecell)

Your support helps improve the plugin and means a lot 💛

---

## 📄 License

MIT License © Alecell


