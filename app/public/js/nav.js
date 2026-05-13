// Navigation commune à toutes les pages
// Pour modifier le menu, éditer uniquement ce fichier
document.addEventListener("DOMContentLoaded", async () => {
  const nav = document.getElementById("topbar");

  if (!nav) return;
  let adminPath = "";
  try {
    const response = await fetch("/api/auth/status");
    if (response.ok) {
      const data = await response.json();
      if (data.role === "admin") {
        adminPath = `<a href="/admin">Admin</a>`;
      }
    }
  } catch (error) {
    console.error("Non connecté ou erreur de vérification");
  }
  nav.innerHTML = `
        <header class="topbar">
            <div class="container">
                <div class="brand">Secure Shop</div>
                <nav class="menu">
                    <a href="/">Accueil</a>
                    <a href="/profile">Profil</a>
                    ${adminPath}
                    <a href="/login">Connexion</a>
                    <a href="/register">Inscription</a>
                </nav>
            </div>
        </header>
    `;
});
