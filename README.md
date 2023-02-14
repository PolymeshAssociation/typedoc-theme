# Polymesh Association Typedoc Theme

Custom theme which extends the [typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown/tree/master/packages/typedoc-plugin-markdown) to format the output to be compatible with the Polymesh SDK documentation used in a Docusaurus site.

## What does it do?

Generates static TypeDoc pages in Markdown with frontmatter suitable for a Docusaurus documentation site. Output documentation is in a hierarchial folder structure and makes use of the docusausaurus autogenerated sidebar.

## Installation

```bash
yarn add --dev typedoc typedoc-plugin-markdown @polymeshassociation/typedoc-theme
```

or

```bash
npm install --save-dev typedoc typedoc-plugin-markdown @polymeshassociation/typedoc-theme
```

## Usage

Usage is the same as documented at [TypeDoc](https://typedoc.org/guides/installation/#command-line-interface) and [typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown/tree/master/packages/typedoc-plugin-markdown).

Typedoc configuration should via a typedoc.json should include `"theme": "polymesh-docs"`.

## Options

This plugin provides additional options beyond the normal options that are [provided by typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown/tree/master/packages/typedoc-plugin-markdown), which are listed below. Note that any vanilla TypeDoc options that customize the HTML theme will be ignored.

### Additional Options:

- `--readmeTitle<string>`<br>
  Frontmatter title for Readme file
- `--readmeLabel<string>`<br>
  Sidebar label for the readme file
- `--indexLabel<string>`<br>
  Sidebar label for the index file

### Modified options:

- `--indexTitle<string>`<br>
  Frontmatter title for the index file
- `--hideBreadcrumbs<boolean>`<br>
  Do not render breadcrumbs in template header. Modified to default to `true`.
- `--hideInPageTOC<boolean>`<br>
  Do not render in-page table of contents items. Modified to default to `true`.
- `--hidePageTitle<boolean>` <br>
  Do not render title in-page contents. Modified to default to `true`. Page titles are always included in the page frontmatter.
