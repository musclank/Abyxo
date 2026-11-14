(() => {
  const config = window.ABYXO_SUPABASE_CONFIG || {};
  const status = document.querySelector("#leaderboard-auth-status");
  const form = document.querySelector("#leaderboard-auth-form");
  const usernameWrap = document.querySelector("#leaderboard-username-wrap");
  const usernameInput = document.querySelector("#leaderboard-username");
  const emailInput = document.querySelector("#leaderboard-email");
  const passwordInput = document.querySelector("#leaderboard-password");
  const submitButton = document.querySelector("#leaderboard-submit");
  const modeButton = document.querySelector("#leaderboard-mode");
  const signOutButton = document.querySelector("#leaderboard-signout");
  const sessionLabel = document.querySelector("#leaderboard-session");
  const list = document.querySelector("#leaderboard-list");
  const refreshButton = document.querySelector("#leaderboard-refresh");
  const playerBest = document.querySelector("#leaderboard-player-best");
  if (!form || !list) return;

  let client = null;
  let mode = "signup";
  let currentUser = null;
  const setStatus = (message, kind = "") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind;
  };
  const setBusy = (busy) => {
    submitButton.disabled = busy;
    submitButton.textContent = busy ? "PLEASE WAIT…" : (mode === "signup" ? "CREATE ACCOUNT ↗" : "SIGN IN ↗");
  };
  const setMode = (nextMode) => {
    mode = nextMode;
    const signingUp = mode === "signup";
    usernameWrap.hidden = !signingUp;
    usernameInput.required = signingUp;
    passwordInput.autocomplete = signingUp ? "new-password" : "current-password";
    submitButton.textContent = signingUp ? "CREATE ACCOUNT ↗" : "SIGN IN ↗";
    modeButton.textContent = signingUp ? "Already registered? Sign in" : "New here? Create an account";
    setStatus(signingUp ? "Choose a public username to join the Abyxonauts." : "Sign in to submit your arcade score.");
  };

  function showSignedOut() {
    currentUser = null;
    sessionLabel.textContent = "Sign in or create an account to join the global ranking.";
    form.hidden = false;
    signOutButton.hidden = true;
    modeButton.hidden = false;
    playerBest.hidden = true;
  }

  async function loadLeaderboard() {
    if (!client) {
      list.innerHTML = '<li class="leaderboard-empty">Leaderboard setup is waiting for the Supabase project connection.</li>';
      return;
    }
    list.innerHTML = '<li class="leaderboard-empty">Loading the abyss rankings…</li>';
    const { data, error } = await client
      .from("leaderboard")
      .select("user_id,best_score,best_level,completed_runs,profiles!leaderboard_user_id_fkey(username)")
      .order("best_score", { ascending: false })
      .order("updated_at", { ascending: true })
      .limit(100);
    if (error) {
      list.innerHTML = '<li class="leaderboard-empty">Rankings are temporarily unavailable. Check the database setup and try again.</li>';
      console.error("ABYXO leaderboard read failed:", error);
      return;
    }
    if (!data || data.length === 0) {
      list.innerHTML = '<li class="leaderboard-empty">No divers on the board yet. Be the first to set a record!</li>';
      return;
    }
    list.replaceChildren();
    data.forEach((entry, index) => {
      const item = document.createElement("li");
      if (currentUser && entry.user_id === currentUser.id) item.classList.add("is-current");
      const rank = document.createElement("span");
      rank.className = "leaderboard-rank" + (index === 0 ? " top-one" : "");
      rank.textContent = "#" + (index + 1);
      const player = document.createElement("span");
      player.className = "leaderboard-player";
      player.textContent = entry.profiles?.username || "Abyxonaut";
      const score = document.createElement("strong");
      score.className = "leaderboard-score";
      score.textContent = Number(entry.best_score || 0).toLocaleString() + " PTS";
      item.append(rank, player, score);
      list.append(item);
    });
    if (currentUser) {
      const mine = data.find((entry) => entry.user_id === currentUser.id);
      if (mine) {
        playerBest.textContent = "YOUR GLOBAL POSITION: #" + (data.indexOf(mine) + 1) + "  ·  BEST " + Number(mine.best_score).toLocaleString() + " PTS";
        playerBest.hidden = false;
      }
    }
  }

  async function updateSession(user) {
    currentUser = user || null;
    if (!currentUser) {
      showSignedOut();
    } else {
      const { data: profile } = await client.from("profiles").select("username").eq("id", currentUser.id).maybeSingle();
      const username = profile?.username || currentUser.user_metadata?.username || "Abyxonaut";
      sessionLabel.textContent = "SIGNED IN AS  " + username;
      form.hidden = true;
      modeButton.hidden = true;
      signOutButton.hidden = false;
      await loadLeaderboard();
      return;
    }
    await loadLeaderboard();
  }

  if (!window.supabase?.createClient || !config.url || !config.anonKey) {
    showSignedOut();
    list.innerHTML = '<li class="leaderboard-empty">Connect an ABYXO Supabase project to activate global rankings. Setup guide: website/SUPABASE_SETUP.md</li>';
    setStatus("Account system is prepared. Supabase project credentials still need to be added by the project owner.");
    return;
  }

  client = window.supabase.createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  modeButton.addEventListener("click", () => setMode(mode === "signup" ? "signin" : "signup"));
  refreshButton?.addEventListener("click", loadLeaderboard);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (mode === "signup") {
        const username = usernameInput.value.trim();
        if (!/^[A-Za-z0-9_]{3,18}$/.test(username)) {
          setStatus("Username must be 3–18 characters: letters, numbers, and underscores only.", "error");
          return;
        }
        const { data, error } = await client.auth.signUp({
          email, password, options: { data: { username } }
        });
        if (error) throw error;
        if (data.session) {
          setStatus("Account created. Welcome to the Abyxonauts!", "success");
          await updateSession(data.user);
        } else {
          setStatus("Account created. Check your email for the confirmation link, then sign in.");
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStatus("Welcome back to the abyss!", "success");
        await updateSession(data.user);
      }
    } catch (error) {
      setStatus(error.message || "Authentication failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  });

  signOutButton.addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    if (error) setStatus(error.message, "error");
    else setStatus("You have signed out.");
    await updateSession(null);
  });

  async function submitScore(score, level, completed) {
    if (!currentUser) {
      setStatus("Sign in before your dive to submit this score to the global leaderboard.", "error");
      return { submitted: false, reason: "not_signed_in" };
    }
    const { error } = await client.rpc("submit_abyxo_score", {
      p_score: Math.max(0, Math.floor(score)),
      p_level: Math.max(1, Math.min(100, Math.floor(level))),
      p_completed: Boolean(completed)
    });
    if (error) {
      setStatus(error.message.includes("rate") ? "Please wait before submitting another run." : "Score could not be submitted. Please try again later.", "error");
      console.error("ABYXO score submission failed:", error);
      return { submitted: false, error };
    }
    setStatus("Dive score submitted to the global leaderboard!", "success");
    await loadLeaderboard();
    return { submitted: true };
  }

  window.ABYXOLeaderboard = { submitScore, refresh: loadLeaderboard };
  setMode("signup");
  client.auth.getSession().then(({ data }) => updateSession(data.session?.user || null));
  client.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => updateSession(session?.user || null), 0);
  });
})();
