const createDefaultNodes = () => [
  {
    id: 0,
    children: []
  }
]

const cloneNode = (node) => {
  const clonedNode = {
    id: node.id,
    children: Array.isArray(node.children) ? node.children.map(cloneNode) : []
  }

  if (node.label !== undefined) {
    clonedNode.label = node.label
  }

  return clonedNode
}

const normalizeNodes = (nodes) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return createDefaultNodes()
  }

  const [rootNode] = nodes

  if (rootNode?.id !== 0) {
    return createDefaultNodes()
  }

  return [cloneNode(rootNode)]
}

const uniqueAnchors = (anchors) => {
  const seenAnchors = new Set()

  return (Array.isArray(anchors) ? anchors : []).filter((anchorId) => {
    if (anchorId === null || anchorId === undefined || anchorId === false || seenAnchors.has(anchorId)) {
      return false
    }

    seenAnchors.add(anchorId)
    return true
  })
}

const getNodePath = (nodes, targetId, ancestry = []) => {
  for (const node of nodes) {
    const nextAncestry = [...ancestry, node.id]

    if (node.id === targetId) {
      return nextAncestry
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      const childPath = getNodePath(node.children, targetId, nextAncestry)

      if (childPath !== null) {
        return childPath
      }
    }
  }

  return null
}

const findNode = (nodes, targetId) => {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      const found = findNode(node.children, targetId)

      if (found !== null) {
        return found
      }
    }
  }

  return null
}

export default {
  namespaced: true,

  state: {
    anchor: 0,

    anchors: [],

    nodes: createDefaultNodes(),
    nodesExpanded: [0],

    scrolling: false,

    base: '',
    relative: '',
    absolute: ''
  },
  getters: {
    anchors (state) {
      return state.anchors
    },

    nodes (state) {
      return state.nodes
    },
    nodesExpanded (state) {
      return state.nodesExpanded
    }
  },
  mutations: {
    resetAnchor (state) {
      state.anchor = 0
    },
    setAnchor (state, val) {
      state.anchor = val
    },

    resetAnchors (state) {
      state.anchors = []
    },
    pushAnchors (state, value) {
      if (value === false) {
        state.anchors = []
      } else if (!state.anchors.includes(value)) {
        // index: id
        state.anchors.push(value)
      }
    },

    resetNodes (state) {
      state.nodes = createDefaultNodes()
    },
    pushNodes (state, node) {
      const found = findNode(state.nodes, node.id)

      if (found) {
        found.label = node.label
        return
      }

      const value = {
        id: node.id,
        label: node.label,
        children: node.children
      }

      const children = state.nodes[0].children
      if (node.child && children.length) {
        children.at(-1).children.push(value)
      } else {
        state.nodes[0].children.push(value)
      }
    },
    setAnchorTree (state, { anchors = [], nodes = createDefaultNodes() } = {}) {
      state.anchors = uniqueAnchors(anchors)
      state.nodes = normalizeNodes(nodes)
      state.nodesExpanded = [0]

      if (state.anchor !== 0 && !state.anchors.includes(state.anchor)) {
        state.anchor = 0
      }
    },
    resetNodesExpanded (state) {
      state.nodesExpanded = [0]
    },
    pushNodesExpanded (state, nodeId) {
      const nodePath = getNodePath(state.nodes, nodeId) || [nodeId]

      for (const pathNodeId of nodePath) {
        if (!state.nodesExpanded.includes(pathNodeId)) {
          state.nodesExpanded.push(pathNodeId)
        }
      }
    },

    setScrolling (state, val) {
      state.scrolling = val
    },

    setBase (state, val) {
      state.base = val
    },
    setRelative (state, val) {
      state.relative = val
    },
    setAbsolute (state, val) {
      state.absolute = val
    }
  },
  actions: {}
}
