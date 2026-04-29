import { defineBook } from '../index.js'

export default defineBook({
  id: 'guide',
  label: 'Guide',
  icon: 'school',
  order: 2,
  color: {
    active: 'white',
    inactive: 'secondary'
  }
})
