import * as path from 'path';
import * as fs from 'fs';
import {
  DeclarationReflection,
  PageEvent,
  Renderer,
  RendererEvent,
  ReflectionKind,
  UrlMapping,
} from 'typedoc';
import { MarkdownTheme } from 'typedoc-plugin-markdown';
import { capitalizePath } from './utils';
import { getKindPlural } from 'typedoc-plugin-markdown/dist/groups';

import { FrontMatterVars, prependYAML } from 'typedoc-plugin-markdown/dist/utils/front-matter';

export type FrontMatter = Record<string, string | boolean | number | null> | undefined;

const CATEGORY_POSITION = {
  [ReflectionKind.Module]: 1,
  [ReflectionKind.Namespace]: 1,
  [ReflectionKind.Enum]: 2,
  [ReflectionKind.Class]: 3,
  [ReflectionKind.Interface]: 4,
  [ReflectionKind.TypeAlias]: 5,
  [ReflectionKind.Variable]: 6,
  [ReflectionKind.Function]: 7,
  [ReflectionKind.ObjectLiteral]: 8,
};

export class PolymeshTheme extends MarkdownTheme {
  readmeTitle!: string;
  readmeLabel?: string;
  indexLabel?: string;

  constructor(renderer: Renderer) {
    super(renderer);

    this.readmeTitle = this.getOption('readmeTitle') as string;
    this.readmeLabel = this.getOption('readmeLabel') as string;
    this.indexLabel = this.getOption('indexLabel') as string;
    // Override default for hideInPageTOC, hideBreadcrumbs and hidePageTitle to true
    this.hideInPageTOC = this.application.options.isSet('hideInPageTOC')
      ? (this.getOption('hideInPageTOC') as boolean)
      : true;
    this.hideBreadcrumbs = this.application.options.isSet('hideBreadcrumbs')
      ? (this.getOption('hideBreadcrumbs') as boolean)
      : true;
    true;
    this.hidePageTitle = this.application.options.isSet('hidePageTitle')
      ? (this.getOption('hidePageTitle') as boolean)
      : true;

    this.listenTo(this.application.renderer, {
      [PageEvent.END]: this.onPageEnd,
      [RendererEvent.END]: this.onRendererEnd,
    });
  }

  toUrl(mapping: any, reflection: DeclarationReflection) {
    const reflectionFullName = reflection.getFullName();
    let fullName: string;
    // Capitalize path so the autogenerated sidebar is capitalized.
    fullName = capitalizePath(reflectionFullName.replace(/\./g, '/'));
    const fileParts = fullName.split('/');
    const fileName = fileParts[fileParts.length - 1];
    // Classes already have a path of ending fileName/fileName.md
    if (reflection.kind === ReflectionKind.Class) {
      return mapping.directory + '/' + fullName + '.md';
    }
    // Docusaurus autogenerated paths resolves /fileName/fileName.md to /fileName.
    // Docusaurus automatically links a sidebar category to a file when it has the
    // same name as the parent directory.
    return mapping.directory + '/' + fullName + '/' + fileName + '.md';
  }

  onPageEnd(page: PageEvent<DeclarationReflection>) {
    if (page.contents) {
      page.contents = prependYAML(page.contents, this.getYamlItems(page) as FrontMatterVars);
    }
  }

  onRendererEnd(renderer: RendererEvent) {
    renderer.project.url &&
      processModuleList(renderer.outputDirectory + '/' + renderer.project.url);

    // create _category_.yaml files for "kind" folders.
    Object.keys(groupUrlsByKind(this.getUrls(renderer.project))).forEach(group => {
      const kind = parseInt(group);
      const mapping = this.mappings.find(mapping => mapping.kind.includes(kind));
      if (mapping) {
        writeCategoryYaml(
          renderer.outputDirectory + '/' + mapping.directory,
          getKindPlural(kind),
          CATEGORY_POSITION[kind],
          true,
          false
        );
      }
    });
  }

  getYamlItems(page: PageEvent<DeclarationReflection>): FrontMatter {
    const pageId = this.getId(page);
    const pageTitle = this.getTitle(page);
    const sidebarLabel = this.getSidebarLabel(page);
    const sidebarPosition = this.getSidebarPosition(page);
    let items: FrontMatter = {
      id: pageId,
      title: pageTitle,
    };

    if (sidebarLabel && sidebarLabel !== pageTitle) {
      items = { ...items, sidebar_label: sidebarLabel };
    }
    if (sidebarPosition) {
      items = { ...items, sidebar_position: parseFloat(sidebarPosition) };
    }
    return {
      ...items,
    };
  }

  getSidebarLabel(page: PageEvent<DeclarationReflection>) {
    const indexLabel = this.indexLabel || 'Table of Contents';

    if (page.url === this.entryDocument) {
      return page.url === page.project.url ? indexLabel : this.readmeLabel;
    }

    if (page.url === this.globalsFile) {
      return indexLabel;
    }

    return path.basename(page.url, path.extname(page.url));
  }

  getSidebarPosition(page: PageEvent<DeclarationReflection>) {
    if (page.url === this.entryDocument) {
      return page.url === page.project.url ? '0.5' : '0';
    }
    if (page.url === this.globalsFile) {
      return '0.5';
    }
    // Everything else will be sorted alphabetically
    return null;
  }

  getId(page: PageEvent<DeclarationReflection>) {
    return path.basename(page.url, path.extname(page.url));
  }

  getTitle(page: PageEvent<DeclarationReflection>) {
    const readmeTitle = this.readmeTitle || page.project.name;
    if (page.url === this.entryDocument && page.url !== page.project.url) {
      return readmeTitle;
    }
    return this.getPageTitle(page);
  }

  getPageTitle(page: PageEvent<DeclarationReflection>) {
    const title: string[] = [];
    if (page.model.kindString && page.url !== page.project.url) {
      title.push(`${page.model.kindString}: `);
    }
    if (page.url === page.project.url) {
      title.push(this.indexTitle || page.project.name);
    } else {
      title.push(this.getName(page));

      if (page.model.typeParameters) {
        const typeParameters = page.model.typeParameters
          .map(typeParameter => typeParameter.name)
          .join(', ');
        title.push(`<${typeParameters}>`);
      }
    }
    return title.join('');
  }

  getName(page: PageEvent<DeclarationReflection>) {
    if (page.model.kindString === 'Module') {
      const nameParts = page.model.name.split('/');

      if (nameParts[nameParts.length - 1] === 'types') {
        const moduleName = nameParts[nameParts.length - 2];
        return moduleName
          ? `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Types`
          : 'Types';
      }
      return nameParts[nameParts.length - 1];
    }
    return page.model.name;
  }
}

const writeCategoryYaml = (
  categoryPath: string,
  label: string,
  position: number | null,
  collapsed: boolean,
  generatedIndex: boolean
) => {
  const yaml: string[] = [`label: "${label}"`];
  if (position !== null) {
    yaml.push(`position: ${position}`);
  }
  if (!collapsed) {
    yaml.push(`collapsed: false`);
  }
  if (generatedIndex) {
    yaml.push(`link:\n  type: generated-index`);
  }
  if (fs.existsSync(categoryPath)) {
    fs.writeFileSync(categoryPath + '/_category_.yml', yaml.join('\n'));
  }
};

const groupUrlsByKind = (urls: UrlMapping[]) => {
  return urls.reduce((r, v, i, a, k = v.model.kind) => ((r[k] || (r[k] = [])).push(v), r), {});
};

const processModuleList = (file: string) => {
  const fileContents = fs.readFileSync(file, 'utf8');
  const lines = fileContents.split('\n');
  const modulesHeaderLine = findModulesHeaderLine(lines);
  if (modulesHeaderLine === -1) return;

  const modulesList = extractModulesList(lines, modulesHeaderLine);
  const newContents = addModulesListToContents(lines, modulesHeaderLine, modulesList);
  fs.writeFileSync(file, newContents);
};

const findModulesHeaderLine = (lines: string[]) => {
  return lines.indexOf('## Modules') !== -1
    ? lines.indexOf('## Modules')
    : lines.indexOf('### Modules');
};

const extractModulesList = (lines: string[], modulesHeaderLine: number) => {
  const linkRegex = /\[(.*?)\]\((.*?)\)/;
  const indentation = '  ';
  const modulesList: string[] = [];
  const currentLevel: string[] = [];

  for (let i = modulesHeaderLine + 1; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(linkRegex);
    if (!match) continue;

    const [, , url] = match;
    const parts = getUrlParts(url);
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        modulesList.push(`${indentation.repeat(i)}- [${part}](${url})`);
        currentLevel[i] = part;
      } else if (part !== currentLevel[i]) {
        modulesList.push(`${indentation.repeat(i)}- ${part}`);
        currentLevel[i] = part;
      }
    });
  }

  return modulesList;
};

const getUrlParts = (url: string) => path.dirname(url).split('/').slice(1);

const addModulesListToContents = (
  lines: string[],
  modulesHeaderLine: number,
  modulesList: string[]
) => {
  let newContents = '';

  for (let i = 0; i < modulesHeaderLine + 1; i++) {
    newContents += lines[i] + '\n';
  }
  newContents += '\n';
  modulesList.forEach(item => {
    newContents += item + '\n';
  });

  return newContents;
};