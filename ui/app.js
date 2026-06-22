// Shared helpers + header for all demo pages. Reads window.DATASET (dataset.js).
(function () {
  const D = window.DATASET;

  const PAGES = [
    { page: "uebersicht", href: "uebersicht.html", label: "Übersicht" },
    { page: "initiativen", href: "initiativen.html", label: "Initiativen" },
    { page: "verteilbogen", href: "verteilbogen.html", label: "Verteilbogen" },
    { page: "ergebnis", href: "ergebnis.html", label: "Ergebnis" },
    { page: "mitglieder", href: "mitglieder.html", label: "Mitglieder" },
    { page: "projekt-mitglieder", href: "projekt-mitglieder.html", label: "Projekt-Mitglieder" },
    { page: "profil", href: "profil.html", label: "Mein Profil" },
  ];

  function money(cents) {
    const sign = cents < 0 ? "-" : "";
    const v = Math.abs(cents) / 100;
    return sign + v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  }

  const membersById = new Map(D.members.map((m) => [m.id, m]));
  const initiativesById = new Map(D.initiatives.map((i) => [i.id, i]));

  const IK = {
    data: D,
    money,
    member: (id) => membersById.get(id),
    memberName: (id) => membersById.get(id)?.name ?? id,
    initiative: (id) => initiativesById.get(id),
    initiativeTitle: (id) => initiativesById.get(id)?.title ?? id,
    viewer: () => membersById.get(D.viewerId),
    esc: (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
  };
  window.IK = IK;

  function buildHeader() {
    const active = document.body.dataset.page;
    const nav = PAGES.map(
      (p) => `<a href="${p.href}" class="${p.page === active ? "active" : ""}">${p.label}</a>`,
    ).join("");
    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML =
      `<div class="bar">` +
      `<a class="brand" href="index.html" style="color:#fff;text-decoration:none">☼ Initiativkonto</a>` +
      `<nav>${nav}</nav>` +
      `</div>`;
    const mount = document.getElementById("app-header");
    if (mount) mount.replaceWith(header);
    else document.body.prepend(header);
  }

  function buildFooter() {
    if (document.querySelector("footer.demo-note")) return;
    const f = document.createElement("footer");
    f.className = "demo-note";
    f.textContent = D.account.note + " · " + D.account.name + " · " + D.account.bank;
    document.body.appendChild(f);
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildHeader();
    buildFooter();
    if (typeof window.renderPage === "function") window.renderPage(IK);
  });
})();
