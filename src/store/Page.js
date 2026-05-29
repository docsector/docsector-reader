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

export default {
  namespaced: true,

  state: {
    anchor: 0,

    anchors: [],

    nodes: [
      {
        id: 0,
        children: []
      }
    ],
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
      state.nodes = [
        {
          id: 0,
          children: []
        }
      ]
    },
    pushNodes (state, node) {
      const found = state.nodes[0].children.find(x => x.id === node.id)

      if (!found) {
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
