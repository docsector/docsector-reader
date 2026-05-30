const isTreeHeadingToken = (token) => token?.tag === 'h2' || token?.tag === 'h3'

const hasAnchorId = (value) => value !== null && value !== undefined && value !== false && value !== ''

const createRootNode = (children = []) => ({
  id: 0,
  children
})

const createTreeNode = (token) => ({
  id: token.anchorId,
  label: token.content,
  children: []
})

export const buildPageAnchorTree = (tokens = []) => {
  const anchors = []
  const rootNode = createRootNode()
  const seenAnchors = new Set()
  let currentParentNode = null

  for (const token of Array.isArray(tokens) ? tokens : []) {
    if (!isTreeHeadingToken(token) || !hasAnchorId(token.anchorId) || seenAnchors.has(token.anchorId)) {
      continue
    }

    seenAnchors.add(token.anchorId)
    anchors.push(token.anchorId)

    const node = createTreeNode(token)

    if (token.tag === 'h3' && currentParentNode !== null) {
      currentParentNode.children.push(node)
      continue
    }

    rootNode.children.push(node)
    currentParentNode = token.tag === 'h2' ? node : null
  }

  return {
    anchors,
    nodes: [rootNode]
  }
}