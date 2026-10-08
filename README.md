# Klassisk Tetris (PWA för iPhone)

Ett modernt, högpresterande och klassiskt Tetris-spel optimerat speciellt för mobil och iPhone som en **Progressive Web App (PWA)** med **100 % offlinestöd**.

## ✨ Funktioner

- **Anpassad för iPhone & Safari:**
  - Fullskärmsläge utan webbläsarlister (`display: standalone`).
  - Stöd för Retina/HiDPI-skärmar med knivskarp grafik och dynamisk canvas-skalning.
  - Safe Area-anpassning för Notch och Dynamic Island.
  - Optimerad layout med en samlad sidopanel till höger (Hold, Next, Poäng, Rekord, Nivå, Rader) så att spelplanen får maximal bredd på alla iPhone-modeller (från SE till Pro Max).
  - Skärmorienteringsskydd med påminnelse om att spela i stående läge.
- **100 % Offline & Extremt låg dataförbrukning:**
  - Hela spelet väger under **110 KB** totalt (under 30 KB komprimerat över nätet).
  - Cachar alla filer via en **Service Worker** (`sw.js`) med versionshantering och cache-busting.
  - **Noll externa ljudfiler eller typsnitt:** Ljudeffekter och 8-bit retro-musik genereras helt i realtid via **Web Audio API**.
- **Klassiska & moderna Tetris-regler:**
  - Standard 10 × 20 spelfält med dolda spawn-rader.
  - 7-Bag randomizer (garanterar rättvis fördelning av bitar).
  - SRS (Super Rotation System) med fulla wall-kicks och floor-kicks.
  - Skuggbit (Ghost piece) och Hold-funktion (Spara bit).
  - Modern Lock Delay (0,5 sekunder med max 15 återställningar, säkrad mot infinite spin).
  - Bilduppdateringsoberoende gravitation (fungerar identiskt på 60 Hz och 120 Hz ProMotion-skärmar).
  - DAS (Delayed Auto Shift) & ARR (Auto Repeat Rate) för blixtsnabb respons vid knapptryck.
  - High score och automatisk sparning av partier via `localStorage`.
- **Ergonomisk styrning:**
  - **Taktila virtuella knappar** utformade för tummarna på iPhone:
    - Vänster tumme: Vänster [◀], Höger [▶], Mjukt fall [▼ Fall].
    - Höger tumme: Rotera moturs [↺], Rotera medurs [↻ Rotera], Spara bit [⇋ Spara], Hårt fall [⤓ Slam].
    - *Mjukt fall och hårt fall är separerade till varsin hand för att eliminera oavsiktliga slams.*
  - **Svepgester (Swipe mode):** Kan aktiveras i inställningarna om du föredrar att svepa direkt på skärmen.
  - **Vänsterhänt läge:** Spegelvänd knapplayout i inställningarna.
  - **Tangentbordsstöd:** För att spela på Mac/PC (Piltangenter / WASD, Mellanslag för drop, C/Shift för hold, P för paus).

---

## 🚀 Snabbstart & Provspelning

### 1. Testa lokalt på datorn
Du kan dubbelklicka på `index.html` eller starta en enkel lokal server:
```bash
python3 -m http.server 8080
```
Öppna sedan `http://localhost:8080` i din webbläsare.

---

### 2. Testa på din iPhone (Lokalt WiFi)
1. Starta servern med din dators lokala IP:
   ```bash
   python3 -m http.server 8080 --bind 0.0.0.0
   ```
2. Ta reda på din Mac:s IP-adress (Systeminställningar -> Nätverk -> Wi-Fi -> Detaljer, t.ex. `192.168.1.50`).
3. Öppna Safari på din iPhone och gå till `http://192.168.1.50:8080`.

*(Obs: För att Service Worker och offline ska aktiveras kräver Safari HTTPS. För att spela helt utan internet publicerar du till en gratis host enligt nedan.)*

---

### 3. Publicera gratis med HTTPS (1 minut)

För att kunna spela **100 % offline på flyget eller utan täckning** behöver Safari HTTPS. Det fixar du gratis och blixtsnabbt med något av följande:

#### Alternativ A: GitHub Pages (Enklast)
1. Skapa ett nytt repo på [GitHub](https://github.com).
2. Ladda upp filerna i denna mapp.
3. Gå till **Settings -> Pages** och välj `Deploy from branch: main / root`.
4. Klart! Du får en länk som slutar på `.github.io`.

#### Alternativ B: Cloudflare Pages / Vercel
1. Dra och släpp hela mappen i Cloudflare Pages eller Vercel Dashboard.
2. Du får en gratis `https://...`-länk direkt.

---

## 📱 Så installerar du på iPhone-hemskärmen

1. Öppna webbadressen i **Safari** på din iPhone.
2. Tryck på **Dela-knappen** (fyrkanten med pilen uppåt längst ner i Safari).
3. Rulla ner och välj **"Lägg till på hemskärmen"** (Add to Home Screen).
4. Tryck på **Lägg till**.
5. Nu har du en ikon på hemskärmen som startar Tetris i **äkta fullskärm** och fungerar **offline utan internet!**

---

## 🎮 Kontroller

| Aktion | iPhone Touch-knapp | Tangentbord (Dator) |
|---|---|---|
| Flytta Vänster / Höger | ◀ / ▶ (Håll in för snabbförflyttning) | Vänsterpil / Högerpil (A / D) |
| Mjukt fall | ▼ Fall | Nedåtpil / S |
| Hårt fall (Slam) | ⤓ Slam | Mellanslag (Space) |
| Rotera medurs | ↻ Rotera | Uppåtpil / W / X |
| Rotera moturs | ↺ | Z / Ctrl |
| Spara bit (Hold) | ⇋ Spara | C / Shift |
| Paus / Meny | ⏸ | Escape / P |
