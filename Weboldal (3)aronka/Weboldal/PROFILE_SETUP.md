## Profil Szerkesztési Funkció - Telepítési útmutató

### Lépések a telepítéshez:

1. **Adatbázis frissítése**
   - Nyiss meg: `http://yourwebsite.hu/php/db_migration.php`
   - Ez hozzáadja az szükséges oszlopokat (`avatar`, `bio`) az adatbázishoz
   - Az oldal megerősítést ad, ha sikeres a migration

2. **Mappa engedélyek**
   - Győződj meg, hogy az `uploads/avatars/` mappához van írási engedély
   - A PHP-nek képesnek kell lennie rá fájlokat létrehozni

3. **Funkciók**
   - Kattints a profil képre (kék négyzet) a főoldalon
   - A profil szerkesztő modal megnyílik
   - Módosítható:
     - Avatar (képfeltöltés)
     - Személyeves adatok (név, bio)
     - Email cím (jelszó szükséges)
     - Jelszó (a jelenlegi jelszót meg kell adni)

### Fájlok:

**Backend:**
- `php/update_profile.php` - Profil adatok frissítése
- `php/get_profile.php` - Profil adatok betöltése
- `php/db_migration.php` - Adatbázis migration

**Frontend:**
- `main.html` - Profil modal HTML
- `data/Fooldal.js` - Modal kezelés
- `assets/style.css` - Modal stílusok

### Adatbázis séma:

Az `users` táblának a következő oszlopokkal kell rendelkeznie:
```sql
- id (PRIMARY KEY)
- username
- email
- password
- first_name
- last_name
- avatar (VARCHAR 255, NULL)
- bio (TEXT, NULL)
```

### Biztonsági megjegyzés:

- Az email módosítása jelszót igényel
- A jelszó módosítása jelenlegi jelszót igényel
- Az avatarak maximális mérete 5MB
- Csak képfájlok engedélyezve (PNG, JPG, GIF)
- Az összes adat szanitizálva van az SQL injection elleni védelemhez

---

**Készült: 2026. február 16.**
