## Overview

Page Feedback adds a **"Was this helpful?"** prompt to the page footer, with three faces: green for helpful, yellow for somewhat helpful and red for not helpful. A reader picks one and the footer thanks them. Picking another face changes the vote, and picking the same face again cancels it.

Each vote is sent to a small Cloudflare Pages Function that Docsector generates at build time. The function stores the vote in a Workers Analytics Engine dataset, and you can query that dataset with SQL to see which pages help readers and which ones need work.

The feature is **opt-in**: the prompt only appears when you enable it.

## Enable It

Add a `feedback` block to `docsector.config.js`:

```js
feedback: {
  enabled: true
}
```

On the next `docsector build`, Docsector writes `functions/feedback.js` and routes `/feedback` to it in `_routes.json`.

## Bind the Dataset

The function writes to an Analytics Engine binding named `FEEDBACK`. Add it to your Pages project once:

1. In the Cloudflare dashboard, open **Workers & Pages**, select your Pages project and go to **Settings → Bindings**.
2. Add an **Analytics Engine** binding. Set the variable name to `FEEDBACK` and choose a dataset name, for example `docs_feedback`.
3. Redeploy the project.

Bindings are set per environment: add it to **Production** and to **Preview**, or votes on preview deployments are rejected.

If you manage the project with Wrangler, declare the same binding in `wrangler.toml` (Pages only reads a `wrangler.toml` that sets `pages_build_output_dir`):

```toml
[[analytics_engine_datasets]]
binding = "FEEDBACK"
dataset = "docs_feedback"
```

The dataset is created on the first write, so there is nothing else to set up.

## Read the Results

Query the dataset through the Analytics Engine SQL API. The API token needs the **Account Analytics: Read** permission:

```bash
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/analytics_engine/sql" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --data "SELECT blob1 AS page, blob2 AS locale, SUM(_sample_interval * double2) AS votes, SUM(_sample_interval * double1) / SUM(_sample_interval * double2) AS score FROM docs_feedback WHERE timestamp > NOW() - INTERVAL '30' DAY GROUP BY blob1, blob2 HAVING SUM(_sample_interval * double2) > 0 ORDER BY votes DESC"
```

`votes` is the number of standing votes and `score` goes from `-1` (every vote is "not helpful") to `1` (every vote is "helpful"). A changed or cancelled vote is written as a compensating point with a negative count, which is why the query sums `double2` instead of counting rows. Multiplying by `_sample_interval` keeps the numbers right when Analytics Engine samples a busy dataset.

To see how the votes split, group by the rating:

```bash
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/analytics_engine/sql" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --data "SELECT blob1 AS page, blob4 AS rating, SUM(_sample_interval * double2) AS votes FROM docs_feedback WHERE timestamp > NOW() - INTERVAL '30' DAY GROUP BY blob1, blob4 ORDER BY page, votes DESC"
```

Analytics Engine keeps data for three months, so export anything you want to keep longer.

## How Votes Behave

- A browser holds **one vote per page, locale and docs version**. Picking another face replaces it, and picking the same face again cancels it.
- The recorded vote is remembered in `localStorage` under `docsector.feedback.*`, so the footer keeps showing it after a reload. It is saved only once the function accepts it: if a send fails, the reader can vote again after a reload.
- The prompt is hidden on pages whose status is `empty`, because there is nothing to rate yet.
- A vote that fails to send never shows an error to the reader. The function logs a rejected vote (naming the invalid field), a missing binding and a failed write; network errors are not logged.
- Only the docs versions and locales the build knows are accepted, so votes always match your version and language lists.
- Votes are only recorded where the generated function runs, which is on Cloudflare Pages. Under `docsector dev` the request gets a 404 and the widget still works.

## Custom Binding Name

To use a binding name other than `FEEDBACK`, set `binding`:

```js
feedback: {
  enabled: true,
  binding: 'DOCS_VOTES'
}
```

## Wording

Override the `page.feedback` keys in your language files to change the text:

```hjson
page: {
  feedback: {
    question: 'Did this page help you?'
    thanks: 'Thank you!'
  }
}
```

## Reference

### Configuration

```js
feedback: {
  enabled: false,
  binding: 'FEEDBACK'
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `false` | Shows the prompt and generates `functions/feedback.js`. Only a literal `true` enables it. |
| `binding` | `'FEEDBACK'` | Name of the Analytics Engine binding the function writes to. |

### Data point

A vote is one data point. Cancelling a vote writes a compensating point, and changing a vote writes both:

| Field | Content |
|-------|---------|
| `index1` | Page path, first 96 bytes (the sampling key) |
| `blob1` | Page path, for example `/manual/basic/footer/overview` |
| `blob2` | Locale, for example `en-US` |
| `blob3` | Docs version id, for example `v4.25.0` |
| `blob4` | Rating: `positive`, `neutral` or `negative` |
| `blob5` | Action: `vote`, or `undo` for a compensating point |
| `double1` | Score: `1`, `0` or `-1` for a vote; the negated score for `undo` |
| `double2` | Count: `1` for a vote, `-1` for `undo` |

### Endpoint

```http
POST /feedback
Content-Type: application/json

{ "path": "/manual/basic/footer/overview", "locale": "en-US", "version": "v4.25.0", "rating": "positive", "previous": "negative" }
```

`rating` is the new vote and `previous` the recorded vote it replaces. Either may be `null` (a first vote, a cancellation), but not both. The function accepts the request only when the ratings are known, the path is a site path of at most 256 URL path characters, the locale and the version are ones the build knows, and the body is at most 1 KB of `application/json`.

| Status | Meaning |
|--------|---------|
| `204` | Vote recorded. |
| `400` | Invalid JSON or an invalid vote (logged with the field name). |
| `403` | The browser sent the vote from another site. |
| `413` | The body is larger than 1 KB. |
| `415` | The body is not `application/json`. |
| `500` | The dataset rejected the write. |
| `503` | The `FEEDBACK` binding is missing. |

### Language keys

| Key | English |
|-----|---------|
| `page.feedback.question` | Was this helpful? |
| `page.feedback.thanks` | Thanks for your feedback! |
| `page.feedback.positive` | Helpful |
| `page.feedback.neutral` | Somewhat helpful |
| `page.feedback.negative` | Not helpful |
| `page.feedback.undo` | Click again to undo |
