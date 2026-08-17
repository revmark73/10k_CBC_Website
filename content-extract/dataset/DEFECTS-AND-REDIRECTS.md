# Defect Register and Redirect Map

Companion to the four JSON extraction files. Every item below was found on the live site as of the crawl.

---

## Blockers: fix before anything ships

| # | Where | What | Status |
|---|---|---|---|
| 1 | `/apply/` | The SOM Site Approval heading and screenshot both link to `ppay.co/LIdjLJn9d-4`, a PushPay donation page. Applicants following instructions land on a giving form. | Link stripped in `pages.json`. Verify no other instance exists. |
| 2 | `/network/` | Page says "do not share," has no authentication, and is indexed by Google. | Route marked `gated` + `noIndex`. Needs Cloudflare Access before launch. |
| 3 | `/ca_disc/` | 2026-2027 print materials read "COMING SOON" with a dead link, on a compliance page, for an academic year already in progress. | Record created with `status: pending`. **You must supply the documents.** |
| 4 | Mobile nav (all pages) | Programs is absent from the mobile menu. Phone users cannot reach the degree list. | Requires one nav definition rendered at both breakpoints. |
| 5 | `/programs/` | Clinical Mental Health Counseling links to Nelson's MBA page. | Set to `NEEDS_VERIFICATION`. **Correct URL required.** |
| 6 | Site-wide | Forms collect names, phones, emails, and high school graduation years, frequently from minors. No privacy policy exists and no consent checkbox is present. | Not fixable by extraction. Needs a policy page and a form consent field. |

---

## Content conflicts resolved in the data

| Conflict | Live site | Resolution |
|---|---|---|
| Site fee | `/why/`: "Annual Site Fee $4,000." `/studentlife/`: "$2,000 a semester." Readable as $6,000/yr. | One `costItem` with `amount: 2000` and `annualEquivalent: 4000`. |
| Program count | "six different undergraduate degree programs," seven listed. | Count computed from the collection. |
| Student success staff | Desi Brantley (`/about/`) vs Krysta Edwards (`/thechapel/`). | Both records created, Edwards flagged `NEEDS_VERIFICATION`. |
| Regan Munsey headshot | Two different photos, 2024 and 2026. | One record. |
| Mark Merrill headshot | Screenshot on `/about/`, real camera file on `/thechapel/`. | One record, camera file preferred. |
| Application dropdown | Every site tells applicants to choose the Visalia value. | Moved to `site.applicationDropdownLabel`. |

---

## Copy corrections applied

`partical` → practical · `Universtity` → University · `cricual` → crucial · `prominent prominent` → prominent · `Mississipi` → Mississippi · `It will noted` → It will be noted · `committed to produce` → committed to producing · `Federal Financial Aid. and offers` → repaired sentence · Crossfire subject/verb agreement · `Site Director |` trailing pipe removed · Interdisciplinary Studies URL stripped of tracking query string.

---

## Content that cannot be extracted, and must be retyped

This is the part to staff and budget for. All of it currently exists only as images.

| Source | File | Contains |
|---|---|---|
| `/pilot/` | `Franchise-Fees-1-1024x576.png` | The entire network site partner pricing table |
| `/current/` | `One-Sheet-Practicum-Training-1.png` | Weekly schedule |
| `/current/` | `1.png` – `5.png` | The complete Fall 2026 calendar of events |
| `/why/` | (rendered chart) | Peer tuition comparison, six data points |
| `/apply/` | `Screenshot-2025-07-02...png` | Application UI walkthrough |

Also missing outright from the public site: the three practicum focuses (promised on `/why/`, rendered as nothing), and the Fall 2026 Student Congress representatives (empty heading on `/current/`).

Photography note: leadership headshots are screenshots of a screen, with filenames containing spaces. Budget a session.

---

## Redirect map

Preserve every existing path. Keep `/ca_disc/` even though it is ugly, in case it is cited in a Nelson compliance filing.

| Old | New | Type |
|---|---|---|
| `/` `/home` | `/` | 301 (consolidate; `/home` is currently the logo target) |
| `/about/` `/why/` `/programs/` `/studentlife/` `/contact/` `/apply/` `/current/` `/ca_disc/` `/pilot/` `/cwe/` | unchanged | preserve |
| `/thechapel/` | `/sites/thechapel/` | 301, once the network directory exists |
| `/network/` | unchanged | preserve, now gated + noindex |
| `http://*` | `https://*` | 301 |
| `www.catalystbible.com/*` | `catalystbible.com/*` | 301 |
| `/disclosures/` | `/ca_disc/` | 301 alias, new path pointing at old |

New routes with no predecessor: `/sites/` (network directory), `/sites/ohio/`, `/sites/compel/`, `/privacy/`.

---

## Open questions I need answers to

1. Correct Nelson URL for Clinical Mental Health Counseling.
2. Is Desi Brantley or Krysta Edwards current? Are both?
3. The Chapel: city, address, phone, and its exact Nelson application dropdown value.
4. Ohio and Compel: are these live, pilot, or announced? They exist only as form dropdown options with zero content behind them. If they are not real yet, remove them from the form.
5. Is the $2,000 semester fee still current for 2026-2027?
6. What are the three practicum focuses?
7. The peer tuition chart: name the schools with a cited source year, or reframe as a range? Anonymous "School 1-5" is unverifiable and weakens a genuinely strong argument.
8. Delivery mode (on-campus, hybrid, online) for the 15 programs where the site does not say.
