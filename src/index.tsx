import { Application, ParameterType } from 'typedoc';

import { PolymeshTheme } from './theme';

export function load(app: Application) {
  app.renderer.defineTheme('polymesh-docs', PolymeshTheme);

  app.options.addDeclaration({
    help: 'README page title.',
    name: 'readmeTitle',
    type: ParameterType.String,
  });

  app.options.addDeclaration({
    help: 'Sidebar label for the readme document.',
    name: 'readmeLabel',
    type: ParameterType.String,
  });

  app.options.addDeclaration({
    help: 'Sidebar label for the index document.',
    name: 'indexLabel',
    type: ParameterType.String,
  });
}
