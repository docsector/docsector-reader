/**
 * Page version status — the menu chip a page earns from the release that shipped
 * it (`config.version`) and the releases that updated it (`config.updated`),
 * measured against the latest released docs version — the highest released
 * entry of the versions selector (`versions` of `virtual:docsector-books`).
 *
 * Versions are compared at minor granularity (`X.Y`): a patch release keeps the
 * chips of its minor, the next minor release drops them.
 *
 * | Condition                               | kind      | reason   |
 * |-----------------------------------------|-----------|----------|
 * | manual `status: 'draft'` / `'empty'`    | draft/empty | —      |
 * | `version` newer than latest released    | `soon`    | `page`   |
 * | `version` in the latest released minor  | `new`     | `page`   |
 * | an `updated` newer than latest released | `soon`    | `update` |
 * | an `updated` in latest released minor   | `updated` | `update` |
 */

/**
 * Parse a version id such as `v1.3.0`, `1.3`, or `v1.0.0-beta.6`. A major alone,
 * a date (`2024-05-01`) or a wildcard (`v1.x`) is not a version.
 *
 * @param {unknown} value - Version id.
 * @returns {{ major: number, minor: number, patch: number } | null} Parsed numbers, or null when unparseable.
 */
export const parse = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const match = value.trim().match(/^v?(\d+)\.(\d+)(?:\.(\d+))?(?:-[0-9a-z.-]+)?(?:\+[0-9a-z.-]+)?$/i)
  if (!match) {
    return null
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3] ?? 0)
  }
}

/**
 * Compare two parsed versions at minor granularity.
 *
 * @returns {number} Negative when a < b, 0 when the same minor, positive when a > b.
 */
const compareMinor = (a, b) => (a.major - b.major) || (a.minor - b.minor)

const compareFull = (a, b) => compareMinor(a, b) || (a.patch - b.patch)

/**
 * Latest released version of the docs: the highest parseable entry of the
 * versions selector that is released. The selector entries are the normalized
 * descriptors of `virtual:docsector-books` (`{ id, released }`), so the release
 * rules (`released`, `status`/`releaseStatus`, `deprecated`) live in one place.
 *
 * @param {Array<{ id?: string, released?: boolean } | string>} [versions] - Normalized version descriptors.
 * @returns {string | null} Latest released version id, or null when none parses.
 */
export const latest = (versions = []) => {
  let best = null
  let bestId = null

  for (const entry of Array.isArray(versions) ? versions : []) {
    const id = typeof entry === 'string' ? entry : entry?.id
    const released = typeof entry === 'string' || entry?.released === true
    const parsed = released ? parse(id) : null

    if (parsed && (best === null || compareFull(parsed, best) > 0)) {
      best = parsed
      bestId = id.trim()
    }
  }

  return bestId
}

/**
 * Tell whether a version is not out yet: newer than the latest release, patch
 * included. It decides the tense of the texts; the chips compare by minor.
 *
 * @param {string} version - Version id.
 * @param {string | null} released - Latest released version id.
 * @returns {boolean} True when both parse and `version` is newer than `released`.
 */
export const upcoming = (version, released) => {
  const a = parse(version)
  const b = parse(released)

  return a !== null && b !== null && compareFull(a, b) > 0
}

/**
 * Normalize `config.updated` into a sorted, deduplicated list of parseable ids.
 *
 * @param {unknown} updated - A version id or an array of them.
 * @returns {string[]} Version ids, oldest first.
 */
export const normalize = (updated) => {
  const values = Array.isArray(updated) ? updated : (updated == null ? [] : [updated])
  const seen = new Set()
  const ids = []

  for (const value of values) {
    if (typeof value !== 'string' || !parse(value)) {
      continue
    }

    const id = value.trim()
    if (!seen.has(id)) {
      seen.add(id)
      ids.push(id)
    }
  }

  return ids.sort((a, b) => compareFull(parse(a), parse(b)))
}

/**
 * Resolve the chip of a page.
 *
 * A legacy `status: 'new'` with no parseable `version` keeps the static "new" chip.
 *
 * @param {{ status?: string, version?: string, updated?: string[] }} page - Page meta.
 * @param {string | null} released - Latest released version id (see `latest()`).
 * @returns {{ kind: 'soon'|'new'|'updated'|'draft'|'empty'|null, version: string|null, reason: 'page'|'update'|null }} The chip.
 */
export const resolve = (page = {}, released = null) => {
  const status = page?.status
  if (status === 'draft' || status === 'empty') {
    return { kind: status, version: null, reason: null }
  }

  const version = typeof page?.version === 'string' ? page.version.trim() : ''
  const shipped = parse(version)
  const current = parse(released)
  const legacy = status === 'new'
    ? { kind: 'new', version: shipped ? version : null, reason: 'page' }
    : { kind: null, version: null, reason: null }

  // ? Nothing to compare against, or a legacy 'new' with no version: the static chip
  if (!current || (!shipped && status === 'new')) {
    return legacy
  }

  // @ The page itself
  if (shipped) {
    const order = compareMinor(shipped, current)
    if (order > 0) {
      return { kind: 'soon', version, reason: 'page' }
    }
    if (order === 0) {
      return { kind: 'new', version, reason: 'page' }
    }
  }

  // @ Its updates — the next upcoming one, else the newest of the released minor
  const updates = normalize(page?.updated)
  const future = updates.filter(id => compareMinor(parse(id), current) > 0)
  if (future.length > 0) {
    return { kind: 'soon', version: future[0], reason: 'update' }
  }

  const recent = updates.filter(id => compareMinor(parse(id), current) === 0)
  if (recent.length > 0) {
    return { kind: 'updated', version: recent.at(-1), reason: 'update' }
  }

  // ? A stale manual 'new' on a page whose version says otherwise is dropped
  return { kind: null, version: null, reason: null }
}

// ! Chip colours per kind: [badge color, text color]
const COLORS = {
  new: ['positive', 'white'],
  soon: ['warning', 'dark'],
  updated: ['info', 'white'],
  draft: ['orange', 'dark'],
  empty: ['red', 'white']
}

/**
 * Describe the menu chip of a route: kind, colours and the i18n keys of its
 * label and tooltip. The tooltip speaks in the future tense for a release that
 * is not out yet (a newer patch of the released minor included).
 *
 * @param {{ status?: string, pageVersion?: string, pageUpdated?: string[] }} meta - Route meta.
 * @param {string | null} released - Latest released version id (see `latest()`).
 * @returns {{ kind: string, color: string, textColor: string, label: string, tooltip: string, version: string|null } | null} The chip, or null for none.
 */
export const describe = (meta, released) => {
  if (!meta) {
    return null
  }

  const chip = resolve({ status: meta.status, version: meta.pageVersion, updated: meta.pageUpdated }, released)
  if (chip.kind === null) {
    return null
  }

  const ahead = chip.version !== null && upcoming(chip.version, released)
  let tooltip = `menu.status.${chip.kind}.tooltip`
  if (chip.kind === 'soon' || ((chip.kind === 'new' || chip.kind === 'updated') && ahead)) {
    tooltip = chip.reason === 'update' ? 'menu.status.soon.tooltipUpdated' : 'menu.status.soon.tooltipVersion'
  } else if (chip.version !== null && chip.kind !== 'draft' && chip.kind !== 'empty') {
    tooltip = `menu.status.${chip.kind}.tooltipVersion`
  }

  const [color, textColor] = COLORS[chip.kind]

  return { kind: chip.kind, color, textColor, label: `menu.status.${chip.kind}._`, tooltip, version: chip.version }
}

/**
 * Lay out the release lines of the page bar: the page's own release (past or
 * future tense) and its updates split into the ones out and the ones to come.
 *
 * @param {{ pageVersion?: string, pageUpdated?: string[] }} meta - Route meta.
 * @param {string | null} released - Latest released version id.
 * @returns {{ version: string, versionLabel: string, past: string, future: string }} Texts to show; empty strings hide a line.
 */
export const timeline = (meta, released) => {
  const version = typeof meta?.pageVersion === 'string' ? meta.pageVersion.trim() : ''
  const updates = normalize(meta?.pageUpdated)

  return {
    version,
    versionLabel: upcoming(version, released) ? 'page.comingVersion' : 'page.newVersion',
    past: updates.filter(id => !upcoming(id, released)).join(', '),
    future: updates.filter(id => upcoming(id, released)).join(', ')
  }
}
