export function capitalizePath(path: string) {
  const folders = path.split('/');
  return folders
    .map(folder => (folder === 'api' ? 'API' : folder.charAt(0).toUpperCase() + folder.slice(1)))
    .join('/');
}
