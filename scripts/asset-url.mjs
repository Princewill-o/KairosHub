// Filesystem-relative paths must become URL paths before serving or caching.
export const assetUrl = relativePath => '/' + relativePath.replaceAll('\\', '/');
