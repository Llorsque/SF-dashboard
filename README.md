
# Sport Fryslân – Verenigingen Monitor (Static Dashboard)

Een lichte, statische dashboardpagina voor monitoring van sportverenigingen. Werkt direct op GitHub Pages met CSV-bestanden.

## ✅ Features
- **Kerncijfers**: aantal verenigingen, gemiddelde contributie, % VOG, % rookvrij, % gezonde kantine
- **Grafieken**: verenigingen per gemeente (bar), adoptie van beleid (bar), ledenontwikkeling (line)
- **Filters**: op gemeente, sport, beleidskenmerken en impactgebieden (bewaren in LocalStorage)
- **Tabel** met zoekfunctie
- **CSV export** van de gefilterde selectie
- **Client-side data laden**: upload je eigen `clubs.csv` en `memberships.csv` zonder iets te deployen

## 📁 Structuur
```
/ (root)
  index.html
  styles.css
  script.js
  /data
    clubs.csv
    memberships.csv
  /assets
    logo.svg
```

## 🧩 CSV-specificaties

### `data/clubs.csv` (kolommen)
- `id`, `club_name`, `sport`, `municipality`, `federation`, `street`, `postal_code`, `city`
- `contact_name`, `contact_email`, `contact_phone`, `position`
- `own_canteen` (ja/nee), `members` (int), `volunteers` (int), `contribution_senior` (euro, int)
- `has_professional` (ja/nee), `newsletter` (ja/nee), `active_club` (ja/nee), `ynbeweging` (ja/nee), `rabo_clubsupport` (ja/nee), `vcper` (ja/nee), `vog_mandatory` (ja/nee), `safe_sport_env` (ja/nee), `smoke_free` (ja/nee), `healthy_canteen` (ja/nee), `catering_license` (ja/nee), `accommodation` (eigen/huur/geen)
- Uitdagingen: `ch_heldere_communicatie`, `ch_samen_verenigen`, `ch_club_voor_iedereen`, `ch_vitaliteit`, `ch_samenwerken_omgeving`, `ch_opgeleid_kader`, `ch_veilig_sportklimaat`, `ch_basis_op_orde` (allemaal ja/nee)
- Impact: `impact_aangepast_sporten`, `impact_0_4`, `impact_4_12`, `impact_12_18`, `impact_55_plus`, `oldstars` (ja/nee)
- Tools/Subsidies: `clubscan_done` (ja/nee), `sport_inclusiefonds` (geen/ingediend/toegekend), `duurzaamheidsmaatregelen` (ja/nee)
- `website`, `notes`

### `data/memberships.csv` (kolommen)
- `club_id` (matcht `id` in clubs.csv)
- `year` (YYYY)
- `total_members`, `youth_members`, `volunteers_count`

> De meegeleverde CSV's bevatten **dummy-data** die direct werkt.

## 🚀 Publiceren op GitHub Pages
1. Maak een **publieke repository** aan op GitHub (bijv. `verenigingen-monitor`).
2. Upload alle bestanden uit deze map (of de ZIP).
3. Ga naar **Settings → Pages** en kies:
   - **Build and deployment** → *Deploy from a branch*
   - **Branch** → `main` / `/ (root)`
4. Wacht tot de site live is (paar seconden) en open de GitHub Pages URL.

## 🔁 Data updaten
- Vervang `data/clubs.csv` en `data/memberships.csv` in de repo **of**
- Klik op **Clubs CSV laden** / **Memberships CSV laden** en laad lokaal een bestand; de pagina ververst met jouw data (client-side).

## 🎯 Huisstijl
- **Kleur**: #212945 (donkerblauw), #52E8E8 (lichtblauw accent)
- **Lettertype**: Archivo (Google Fonts)
- Clean kaarten, zachte schaduw, afgeronde hoeken

## 🧠 Tips voor interactieve uitbreidingen
- **Gemeente-kaart** met Leaflet + GeoJSON voor ruimtelijke inzichten.
- **Trendselectie**: toggle tussen *leden*, *jeugdleden*, *vrijwilligers* in de lijnchart.
- **Doelwaarden**: stel targets in (bijv. % rookvrij) en kleur KPIs rood/oranje/groen.
- **Teamnotities**: voeg een *Insights* panel toe en laat bevindingen exporteren naar Markdown/PDF.
- **API-koppeling**: later vervangen van CSV door (beschermde) endpoint of SharePoint/PowerBI export.
- **Rolgebaseerde views**: filters/kolommen per rol (beleid, buurtsportcoach, directeur).
- **Validatie**: highlight inconsistenties (bijv. VOG=ja maar vrijwilligers=0).

## 🔒 Privacy
Alle data wordt client-side geladen en verwerkt. Publiceer geen persoonsgegevens als dat niet nodig is.

---

Vragen of uitbreiden? Laat het weten – deze basis is modulair, dus nieuwe grafieken, filters of exporten zijn snel bij te bouwen.
