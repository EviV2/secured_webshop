document.addEventListener("DOMContentLoaded", async () => {
  const nav = document.getElementById("topbar");
  if (!nav) return;

  //link ici est une list qui contient les liens de nav que je vais afficher (marrant que l'on sois pas obliger d'utiliser des loops pour afficher ca)
  let links = `<a href="/">Accueil</a>`; // Le lien toujours présent

  try {
    const response = await fetch("/api/auth/status");

    if (response.ok) {
      const data = await response.json();

      // On ajoute les liens pour les connecter
      links += `<a href="/profile">Profil</a>`;

      if (data.role === "admin") {
        links += `<a href="/admin">Admin</a>`;
      }

      links += `<a href="/api/auth/logout">Déconnexion</a>`;

      links += `<span style="margin-left:15px; color:#00D2AF;">(${data.username})</span>`;
    } else {
      // Liens au cas ou même si ils vont dans le catch si ils ne sont pas connecter
      links += `
        <a href="/login">Connexion</a>
        <a href="/register">Inscription</a>
      `;
    }
  } catch (error) {
    //Typiquement si on est pas connecter
    links += `<a href="/login">Connexion</a>
              <a href="/register">Inscription</a>
              `;
  }

  nav.innerHTML = `
    <header class="topbar">
        <div class="container">
            <div class="brand">Secure Shop</div>
            <nav class="menu">
                ${links}
            </nav>
        </div>
    </header>
  `;
});
