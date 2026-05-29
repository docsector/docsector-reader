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
      if (!state.nodesExpanded.includes(nodeId)) {
        state.nodesExpanded.push(nodeId)
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
