module.exports = {
  repositoryUrl: 'https://github.com/PolymeshAssociation/typedoc-theme.git',
  branches: ['main'],
  /*
   * The expectation is for Github plugin to create a tag that begins with `v`, which triggers a workflow for publishing a docker container
   */
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    {
      path: '@semantic-release/git',
      assets: ['package.json', 'CHANGELOG.md', 'README.md', 'docs'],
    },
    [
      '@semantic-release/github',
      {
        assets: ['CHANGELOG.md'],
      },
    ],
  ],
};
