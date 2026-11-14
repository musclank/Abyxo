# ABYXO Global Leaderboard — setup

The website UI and Supabase client integration are in place. A Supabase project is required to activate real accounts and shared rankings.

## 1. Create the database project
1. Create a project at https://supabase.com/dashboard.
2. Open **SQL Editor → New query**.
3. Paste and run the complete contents of `supabase/leaderboard.sql`.

This creates player profiles, the public read-only top-100 leaderboard, and a restricted score-submission function. Email addresses are never included in public leaderboard queries.

## 2. Configure Supabase Auth
1. In **Authentication → URL Configuration**, add this Site URL:
   `https://musclank.github.io/Abyxo/`
2. Add the same URL to the Redirect URLs allow-list.
3. Keep email confirmation enabled for production. Players will need to confirm their email before signing in if confirmation is required.

## 3. Connect the website
1. Open the project's **Connect** dialog to copy the Project URL and publishable key, or go to **Settings → API Keys** to view/manage the keys.
2. Open `website/supabase-config.js`.
3. Paste the values into `url` and `anonKey`.
4. Commit the file to the `main` branch.

Only the publishable/anon key belongs in the browser. **Never use the service_role key** in GitHub Pages or any client-side file.

## 4. How it works
- Players register with email, password, and a public username (3–18 letters, numbers, or underscores).
- The leaderboard displays usernames and each player's best score, not email addresses.
- A completed or failed run submits once, if the player is signed in.
- The database function ties the submission to the authenticated user, limits score/level ranges, and rate-limits submissions.
- The browser's local Best Score remains a personal device score; the global ranking is stored in Supabase.

## Important security note
A static browser game cannot prove that a player did not modify their local JavaScript. The database enforces identity, bounds, and submission rate limits, but these are not a complete anti-cheat system. Stronger cheat resistance would require server-authoritative gameplay or replay validation.
