import { defineSsrMiddleware } from '#q-app/wrappers'

// The catch-all middleware: hands every request over to Vue Router + Vue SSR.
// In Docsector this only serves the local preview — production is static HTML
// generated at build time from the same render pipeline.
export default defineSsrMiddleware(({ app, resolve, render }) => {
  app.get(resolve.urlPath('*'), (req, res) => {
    res.setHeader('Content-Type', 'text/html')

    render({ req, res })
      .then((html) => {
        res.send(html)
      })
      .catch((err) => {
        if (err.url) {
          if (err.code) {
            res.redirect(err.code, err.url)
          } else {
            res.redirect(err.url)
          }
        } else if (err.code === 404) {
          res.status(404).send('404 | Page Not Found')
        } else {
          res.status(500).send('500 | Internal Server Error')
          console.error(err.stack || err)
        }
      })
  })
})
