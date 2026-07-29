// Matches the README's "latest release" line for both stable and prerelease versions,
// e.g. `v9.6.0` and `v10.0.0-RC.2`.
const regex = /`v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)` is the latest release\./

module.exports.readVersion = function(contents) {
  const match = contents.match(regex)
  if (!match) {
    throw new Error(
      'update-readme-release: could not find a "`vX.Y.Z` is the latest release." line in README.md. ' +
      'standard-version cannot bump the README until that line is restored.'
    )
  }
  return match[1]
}

module.exports.writeVersion = function(contents, version) {
  if (!regex.test(contents)) {
    throw new Error(
      'update-readme-release: refusing to bump README.md silently — the "`vX.Y.Z` is the latest release." ' +
      'line is missing.'
    )
  }
  return contents.replace(regex, "`v" + version + "` is the latest release.")
}
