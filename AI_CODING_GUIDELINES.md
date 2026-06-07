# AI Coding Guidelines

Ez a dokumentum rögzíti a kód bázis fejlesztési alapelveit. Minden generált és kézzel írt kódnak meg kell felelnie ezeknek a szabályoknak, hogy fenntartsuk a kód átláthatóságát és karbantarthatóságát a refaktorálás után is.

## 1. Architektúra és Fájlstruktúra (Separation of Concerns)

- **UI Komponensek (`src/components/`)**: Csak a megjelenítésért (layout, stílusok, HTML struktúra) felelősek. Nem tartalmazhatnak komplex üzleti logikát vagy formázó logikákat.
- **Custom Hooks (`src/hooks/`)**: Az állapotkezelés (state) és a hozzá kapcsolódó üzleti logika (CRUD, API/fájl műveletek) külön hookokba kell hogy kerüljenek (pl. `useTransactions`).
- **Segédfüggvények (`src/utils/`)**: Minden olyan tiszta (pure) függvény, ami bemeneti paraméterekből kimenetet számol (pl. szám formázás, CSV parse, vágólap generálás), a `utils/` mappába kerül. Ezeknek függetlennek kell lenniük a React állapottól.
- **Típusok (`src/types/`)**: Minden interfész és típusdefiníció közös helyre kerül, hogy elkerüljük a duplikációkat és a körkörös függőségeket.

## 2. Fájlméret és Komplexitás Korlátok

- **Max 250 sor**: Egyetlen fájl sem haladhatja meg a 250 sort (kivéve nagyon indokolt esetben). Ha egy komponens vagy fájl túl nagyra nő, szét kell bontani kisebb, újrahasznosítható részekre.
- **Egy felelősség elve (Single Responsibility Principle)**: Egy függvény vagy komponens csak egy dolgot csináljon. Például a `TransactionRow` csak egy sor kirajzolásáért és annak lokális edit állapotáért feleljen.

## 3. Típusbiztonság (TypeScript)

- **Szigorú típusosság**: Tilos az `any` használata. Minden változónak, függvény paraméternek és visszatérési értéknek explicit típussal kell rendelkeznie.
- **Interfészek használata**: A domain modelleket (pl. `Transaction`) mindig interfészként definiáljuk a `src/types/index.ts`-ben.

## 4. Kód Stílus és Tisztaság

- **Elnevezések**: Használjunk leíró, tiszta neveket (pl. `formatOsszeg` a formázáshoz, `parseNumber` a szám konverzióhoz). Kerüljük a rövidítéseket.
- **Kommentek megőrzése**: Meglévő, nem érintett kommenteket és dokumentációt meg kell tartani a módosítások során is.
- **Segédfüggvények exportálása**: A segédfüggvényeket érdemes unit tesztelhetővé tenni (exportálni őket), még akkor is, ha csak egy helyen használjuk őket.

## 5. Külső könyvtárak

- **Ikonok**: Használjuk a `lucide-react` csomagot.
- **CSS**: Használjunk Vanilla CSS-t (`src/index.css` alapú segédosztályok és formázások), hacsak nincs explicit Tailwind vagy más kérés.
