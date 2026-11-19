// Vitrine de Matthew — lecture seule. Lit data/vitrine.json (généré par matthew/vitrine.py,
// liste blanche vérifiée) et le met en scène dans une base lunaire three.js.
// Tout le texte de la page est en HTML : la 3D n'est qu'un plus, et s'efface si WebGL manque
// ou si le visiteur demande moins de mouvement. Français et anglais (bouton FR / EN).
//
// Direction : le scroll pilote une caméra continue (un chemin qui passe par un plan par chapitre,
// avec un temps de pose sur chacun) ; le vert ne marque que ce qui est appris, validé ou en cours
// pour de vrai. Rien n'est simulé : chaque animation rejoue une donnée publiée.

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const OG = new URLSearchParams(location.search).has("og");          // capture pour l'image de partage
// Écran tactile (téléphone, tablette, en portrait comme en paysage) : la scène ne reçoit plus le
// doigt (CSS : pointer-events none), sinon défiler devient presque impossible ; un toucher
// court sur une lumière ou un bâtiment est rattrapé au niveau du document (pickAt).
const TOUCH = matchMedia("(pointer: coarse)").matches;
document.documentElement.classList.toggle("touch", TOUCH);
const $ = (id) => document.getElementById(id);
const pct = (x) => (x == null ? "—" : Math.round(x * 100) + " %");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ── Langue ───────────────────────────────────────────────────────────────────
const I18N = {
  fr: {
    doc_title: "Matthew — une intelligence qui apprend",
    skip: "Aller aux informations techniques", ld_text: "Base lunaire — mise sous tension",
    tour_short: "Visite", menu: "Index", menu_close: "Fermer",
    kicker: "Apprentissage en public · lecture seule",
    tag1: "Une intelligence qui apprend.", tag2: "Une intelligence qui évolue.",
    hero_num: "de bonnes réponses à son dernier examen", hero_tools: "savoir-faire appris", hero_since: "version en service depuis",
    live_follow: "suivre en direct", scroll: "Explorer",
    ch_arrival: "Arrivée", ch_core: "Le noyau", ch_skills: "Savoir-faire", ch_cycle: "Le cycle", ch_exam: "L'examen",
    ch_evo: "L'évolution", ch_trust: "Transparence", ch_tech: "Technique",

    c1_h: "Un esprit au centre de la base.",
    c1_p: "Matthew vit sur un ordinateur de salon. Ici, on le montre comme une base : au centre, son esprit ; autour, tout ce qu'il sait faire. Chaque nuit, cinq rôles s'y relaient.",
    sp_base: "Modèle de base", sp_since: "Version en service", sp_skills: "Savoir-faire", sp_ex: "Exemples vérifiés",
    parts: "<li><b>Le professeur</b><span>Un modèle ouvert invente des demandes réalistes pour chaque savoir-faire.</span></li><li><b>Le vérificateur</b><span>Un autre modèle, à l'aveugle, doit retrouver le bon savoir-faire. Sinon, la demande est jetée.</span></li><li><b>L'élève</b><span>Matthew lui-même, entraîné sur une carte graphique de salon à partir d'un modèle ouvert.</span></li><li><b>L'examen</b><span>Des demandes jamais vues pendant l'entraînement, notées savoir-faire par savoir-faire.</span></li><li><b>Le champion</b><span>La version en service. Elle ne cède sa place qu'à un candidat qui fait mieux.</span></li>",

    c2_h: "Chaque lumière est un savoir-faire.",
    c2_p: "Ouvrir une application, retrouver un fichier, chercher la météo, envoyer un message, se souvenir… Plus la lumière est verte, mieux il le maîtrise. Éteinte : il ne l'a pas encore appris.",
    c2_hint: "Choisissez un domaine, ou touchez une lumière dans la base.",
    h_skills: "Tous ses savoir-faire", p_skills: "La barre : sa précision au dernier examen. Grisé : pas encore appris. Un clic ouvre la fiche.",

    c3_h: "Chaque nuit, il apprend.",
    c3_p: "Pendant que tout le monde dort, il s'entraîne sur de nouveaux exemples. Une nuit suit toujours les mêmes six étapes ; elles s'allument ici quand une nuit est vraiment en cours.",
    live_now: "En direct", cycle_idle: "Aucune nuit en cours en ce moment.",
    tl_title: "Frise des nuits", tl_play: "Rejouer", tl_stop: "Arrêter", tl_aria: "Choisir une nuit",
    tl_sum: (n, total, s) => ` · ${n}/${total} savoir-faire${s != null ? ` · score ${s.toFixed(2)}` : ""}`,

    c4_h: "Puis il passe un examen.",
    c4_p: "Des questions inventées pour l'occasion, souvent jamais vues. Pour chacune, il doit choisir le bon savoir-faire. Rejeu de son dernier examen :",
    crit_h: "Ce que l'examen mesure — champion en service",
    cr_composite: "Score global", cr_tool_name: "Bon savoir-faire", cr_tool_args: "Bons paramètres", cr_irrelevance: "Savoir s'abstenir",
    cr_valid: "Réponse bien formée", cr_latency_p50: "Temps de réponse médian",
    crd_composite: "La note qui décide des promotions.", crd_tool_name: "Il choisit l'outil attendu.", crd_tool_args: "Il le remplit correctement.",
    crd_irrelevance: "Il n'appelle rien quand rien ne convient.", crd_valid: "Sa réponse se lit sans erreur.", crd_latency_p50: "La moitié des réponses arrive plus vite.",

    c5_h: "Il ne garde que ses progrès.",
    c5_p: "Chaque nuit produit un candidat. Il passe le même examen que le champion en service ; il ne le remplace que s'il fait mieux. Sinon, rien ne change.",
    du_date: "Nuit", du_cand: "Candidat", du_ref: "Champion à battre", du_win: "Promu", du_lose: "Rejeté",
    du_noref: "premier", du_none: "Pas encore de duel publié.",
    lg_champ: "Champion en service", lg_win: "Candidat promu", lg_lose: "Candidat rejeté", chart_title: "Score de chaque candidat, nuit après nuit",
    first_night: "Première nuit — la courbe se dessine nuit après nuit",
    dl_up: "Progrès", dl_down: "Reculs", dl_none: "Aucun",
    dl_note: (a, b) => `Le candidat du ${a} face au champion qu'il affrontait (candidat du ${b}), savoir-faire par savoir-faire, chacun à l'examen de sa nuit.`,
    dl_noref: "Les écarts savoir-faire par savoir-faire apparaîtront dès qu'un candidat affrontera un champion publié.",
    h_ba: "Avant / après", p_ba: "La même phrase, posée à Matthew deux nuits différentes. Ses réponses, telles quelles.",
    ba_empty: "Les premières réponses arrivent avec le prochain examen.",
    ba_single: (d) => `La comparaison apparaîtra dès la prochaine nuit (seule réponse : ${d}).`,

    c6_h: "Rien d'autre n'est montré.",
    pledges: "<li data-n=\"01\"><b>Conversations protégées</b><span>Aucune vraie conversation n'est publiée : tout ce que vous voyez est inventé pour l'examen.</span></li><li data-n=\"02\"><b>Provenance des données</b><span>Il n'apprend jamais en copiant Gemini ou Claude — seulement auprès de modèles libres et des corrections de son utilisateur.</span></li><li data-n=\"03\"><b>Traçabilité</b><span>Chaque amélioration est datée dans un journal public, avec son flux Atom.</span></li><li data-n=\"04\"><b>Vérification</b><span>Une nouvelle version ne prend la relève qu'après un examen sur des questions jamais vues.</span></li><li data-n=\"05\"><b>Résultats entiers</b><span>Les échecs, les candidats rejetés et les nuits interrompues sont publiés aussi.</span></li>",
    c_tokens: "mots écrits par Matthew (tokens)", c_nights: "nuits d'apprentissage", c_gpu: "heures d'entraînement",
    c6_more: "Informations techniques ↓",

    d_h: "Pour les curieux.", st_score: "Score de l'examen", st_tool: "Bon savoir-faire choisi", st_tools: "Savoir-faire appris",
    st_ex: "Exemples vérifiés", st_changes: "Améliorations (30 j)", st_streak: "Nuits d'affilée",
    scene_aria: "Scène 3D : la base de Matthew sur la Lune, son noyau au centre, un bâtiment par domaine et une lumière par savoir-faire, la Terre à l'horizon. Chaque question de l'examen part du noyau vers le savoir-faire choisi.",
    h_exam: "L'examen, jour par jour", p_exam: "Le même examen chaque nuit. « Jamais vu » : une demande que Matthew n'a jamais rencontrée en s'entraînant. Toutes les demandes sont inventées pour l'examen ; aucune ne vient d'une vraie conversation.",
    exam_req: "Demande (inventée pour l'examen)", exam_tool: "Attendu",
    h_changes: "Le journal des améliorations", p_changes: "Tout ce qui l'a fait progresser : son intelligence, sa voix, son interface, sa fiabilité. La page se met à jour d'elle-même à chaque amélioration.",
    all: "Tout", more: (n) => `Voir les ${n} autres`, changes_empty: "Les premières améliorations arrivent.",
    h_nights: "Les nuits, une par une", nights_empty: "Pas encore de nuit d'apprentissage.", h_how: "Comment il apprend, en détail",
    steps: "<li><b>Inventer.</b> Un modèle ouvert écrit des demandes réalistes pour chaque outil.</li><li><b>Vérifier.</b> Un autre modèle, à l'aveugle, doit retrouver le bon outil. Sinon, la demande est jetée.</li><li><b>S'entraîner.</b> Sur une carte graphique de salon, depuis un modèle ouvert.</li><li><b>Passer l'examen.</b> Sur des demandes jamais vues, outil par outil.</li><li><b>Prendre la relève</b> seulement s'il bat la version précédente. Sinon, rien ne change.</li>",
    rules: "Règles : aucune vraie conversation n'est publiée ici ; aucune réponse de Gemini ou de Claude ne lui sert de modèle — seulement des modèles sous licence ouverte et les corrections de son utilisateur.",
    dr_cases: "Ses questions d'examen", f_updated: "Mis à jour le", f_base: "base",
    credits: "Page en lecture seule, régénérée à chaque amélioration · <a href=\"feed.xml\">flux des améliorations (Atom)</a>. Architecture de la base dessinée en code · rochers, cratères, rover, vaisseau et astronaute : <a href=\"https://kenney.nl/assets/space-kit\">Space Kit de Kenney</a> (CC0) · éclairage <a href=\"https://polyhaven.com/a/qwantani_night_puresky\">Poly Haven</a> (CC0) · Lune, Terre et Voie lactée : <a href=\"https://www.solarsystemscope.com/textures/\">Solar System Scope</a> (CC BY 4.0) · caractères Instrument Serif, Hanken Grotesk, JetBrains Mono (SIL OFL) · rendu <a href=\"https://threejs.org\">three.js</a>.",
    no_data: "Les données du jour ne sont pas encore publiées.", first_exam: "Premier examen ce soir.",
    todo: "à venir", learned: "appris", never_seen: "jamais vu", seen_train: "vu à l'entraînement",
    ok: "réussi", ko: "raté", no_tool: "aucun outil", today: "Aujourd'hui", j7: "J-7",
    count: (i, n, ok, d, ms) => `${i}/${n} · ${ok} réussis le ${d}${ms ? ` · ${ms} s` : ""}`,
    chosen: "choisi", t_chat: "Conversation", t_none: "Refus poli", answered: "a répondu sans outil",
    live_training: "Entraînement en cours", epoch: (a, b) => ` — époque ${a}/${b}`,
    next_label: "Prochaine nuit d'apprentissage", next_ics: "Me le rappeler (agenda)", u_h: "h", u_m: "min", u_s: "s",
    next_when: (d, tz) => tz ? `${d} (votre heure) · ${tz} chez Matthew` : d,
    next_wait: "L'heure prévue est passée : la nuit n'a pas encore commencé, Matthew attend que son ordinateur se réveille.",
    next_off: "Entraînements en pause pour l'instant.",
    next_stale: (d) => `Cette page n'a pas été mise à jour depuis le ${d} : l'ordinateur de Matthew ne publie plus pour l'instant. Les chiffres ci-dessus datent de ce jour-là.`,
    ph_prep: "Préparation", "ph_entraînement": "Entraînement", ph_export: "Empaquetage", ph_import: "Installation",
    ph_exam: "Examen", ph_duel: "Duel avec le champion",
    lv_prep: "Il relit ses nouveaux exemples et prépare la nuit.",
    lv_train: (a, b, l) => `Époque ${a} sur ${b}${l != null ? ` · erreur ${l}` : ""} — plus l'erreur baisse, mieux il apprend.`,
    lv_export: "Entraînement terminé : il se met en boîte pour pouvoir répondre.",
    lv_import: "Le nouveau Matthew s'installe à côté de l'ancien.",
    lv_exam: (d, t, r) => `Examen du nouveau Matthew : ${d}/${t} questions, ${r} bonnes réponses.`,
    lv_duel: (d, t, r) => `L'ancien champion passe le même examen : ${d}/${t}, ${r} bonnes réponses.`,
    toast_champ: "Nouveau champion : Matthew vient de progresser", toast_done: "La nuit est finie : résultats à jour",
    ics_title: "Matthew apprend (nuit d'entraînement)",
    dr_meta: (ex, n) => `${ex} exemples vérifiés · ${n} examen${n > 1 ? "s" : ""} noté${n > 1 ? "s" : ""}`,
    dr_soon: " · il l'apprendra dans les prochaines nuits", dr_none: "Pas encore de scénario d'examen pour cet outil.",
    share: "Partager", shared: "Lien copié", share_text: "Regardez une IA apprendre chaque nuit, en public.",
    q_auto: "AUTO", q_high: "HAUTE", q_eco: "ÉCO",
    q_title: { auto: "Qualité automatique : la page s'allège seule si l'ordinateur peine", high: "Qualité haute : tous les effets", eco: "Qualité éco : pour les ordinateurs modestes" },
    q_toast: "La page s'est allégée pour rester fluide (bouton AUTO en haut)",
    tour_btn: "Visite guidée par Matthew",
    sp_k: "Ses spécialités", sp_h: "Il ne prend une tâche que s'il la mérite.",
    sp_p: "Matthew ne remplace pas tout d'un coup. Pour chaque type de tâche, il passe une épreuve à part. Il ne s'en charge que s'il atteint le seuil et fait au moins aussi bien que le modèle qu'il remplacerait.",
    sp_on: "il s'en charge", sp_off: "pas encore", sp_ref: (r) => ` · référence ${r}`, sp_floor: (f) => `seuil ${f}`,
    sp_n: (n) => `${n} cas notés`,
    g_skip: "Passer la visite", g_next: "Suivant", g_end: "Terminer", g_voice: "Voix de Matthew",
    g: {
      hello: "Bonjour. Je suis Matthew, une intelligence artificielle qui apprend un peu plus chaque nuit. Je vous fais visiter ma base ?",
      base: "En vrai, je vis sur un ordinateur de salon. Ici, on me montre comme une base sur la Lune. La lumière verte, au centre, c'est mon esprit.",
      skills: "Chaque lumière autour de moi est un savoir-faire. Verte : je le maîtrise. Éteinte : pas encore appris. Choisissez un domaine pour y voler.",
      spec: "Je me spécialise petit à petit : je ne reprends une tâche que si une épreuve prouve que je la fais bien.",
      night: "Chaque nuit, je m'entraîne sur de nouveaux exemples, toujours en six étapes. Elles s'allument ici quand une nuit est en cours.",
      night_live: "D'ailleurs, je suis en plein entraînement en ce moment. Vous pouvez suivre chaque étape ici, en direct.",
      exam: "Ensuite, je passe un examen : des questions inventées, que je n'ai souvent jamais vues.",
      score: (s) => `À mon dernier examen : ${s} de bonnes réponses. Voici ce que l'examen mesure, critère par critère.`,
      evo: "Une nouvelle version de moi ne prend ma place que si elle fait mieux. Les candidats rejetés restent affichés : rien n'est caché.",
      bye: "Rien de privé ici : tout ce que vous voyez est inventé pour l'examen. Le bouton « Visite », en haut, me rappelle. Bonne exploration.",
    },
  },
  en: {
    doc_title: "Matthew — an intelligence that learns",
    skip: "Skip to the technical details", ld_text: "Lunar base — powering up",
    tour_short: "Tour", menu: "Index", menu_close: "Close",
    kicker: "Learning in public · read-only",
    tag1: "An intelligence that learns.", tag2: "An intelligence that evolves.",
    hero_num: "right answers at its last exam", hero_tools: "skills learned", hero_since: "version serving since",
    live_follow: "follow live", scroll: "Explore",
    ch_arrival: "Arrival", ch_core: "The core", ch_skills: "Capabilities", ch_cycle: "The cycle", ch_exam: "The exam",
    ch_evo: "Evolution", ch_trust: "Transparency", ch_tech: "Technical",

    c1_h: "A mind at the heart of the base.",
    c1_p: "Matthew lives on a home computer. Here we show it as a base: its mind in the middle, everything it can do all around. Every night, five roles take turns.",
    sp_base: "Base model", sp_since: "Serving version", sp_skills: "Skills", sp_ex: "Verified examples",
    parts: "<li><b>The teacher</b><span>An open model invents realistic requests for every skill.</span></li><li><b>The verifier</b><span>Another model, blind, must find the right skill. Otherwise the request is thrown away.</span></li><li><b>The student</b><span>Matthew itself, trained on a home graphics card from an open model.</span></li><li><b>The exam</b><span>Requests never seen during training, scored skill by skill.</span></li><li><b>The champion</b><span>The version in service. It only steps aside for a candidate that does better.</span></li>",

    c2_h: "Every light is a skill.",
    c2_p: "Opening an app, finding a file, checking the weather, sending a message, remembering… The greener the light, the better it is at it. Off: not learned yet.",
    c2_hint: "Pick a domain, or tap a light in the base.",
    h_skills: "All its skills", p_skills: "The bar: accuracy at the last exam. Greyed out: not learned yet. Click for details.",

    c3_h: "Every night, it learns.",
    c3_p: "While everyone sleeps, it trains on new examples. A night always follows the same six steps; they light up here when a night is really under way.",
    live_now: "Live", cycle_idle: "No night under way right now.",
    tl_title: "Night by night", tl_play: "Replay", tl_stop: "Stop", tl_aria: "Pick a night",
    tl_sum: (n, total, s) => ` · ${n}/${total} skills${s != null ? ` · score ${s.toFixed(2)}` : ""}`,

    c4_h: "Then it sits an exam.",
    c4_p: "Questions made up for the occasion, often never seen before. For each one it must pick the right skill. Replay of its last exam:",
    crit_h: "What the exam measures — serving champion",
    cr_composite: "Overall score", cr_tool_name: "Right skill", cr_tool_args: "Right parameters", cr_irrelevance: "Knowing to abstain",
    cr_valid: "Well-formed answer", cr_latency_p50: "Median response time",
    crd_composite: "The score that decides promotions.", crd_tool_name: "It picks the expected tool.", crd_tool_args: "It fills it in correctly.",
    crd_irrelevance: "It calls nothing when nothing fits.", crd_valid: "Its answer parses without error.", crd_latency_p50: "Half of the answers arrive faster.",

    c5_h: "It only keeps its progress.",
    c5_p: "Every night produces a candidate. It sits the same exam as the serving champion and only replaces it if it does better. Otherwise nothing changes.",
    du_date: "Night", du_cand: "Candidate", du_ref: "Champion to beat", du_win: "Promoted", du_lose: "Rejected",
    du_noref: "first", du_none: "No duel published yet.",
    lg_champ: "Serving champion", lg_win: "Promoted candidate", lg_lose: "Rejected candidate", chart_title: "Each candidate's score, night after night",
    first_night: "First night — the curve draws itself night after night",
    dl_up: "Gains", dl_down: "Setbacks", dl_none: "None",
    dl_note: (a, b) => `The ${a} candidate against the champion it faced (the ${b} candidate), skill by skill, each at its own night's exam.`,
    dl_noref: "Skill-by-skill differences will appear as soon as a candidate faces a published champion.",
    h_ba: "Before / after", p_ba: "The same sentence, asked to Matthew on two different nights. Its answers, verbatim (in French).",
    ba_empty: "The first answers come with the next exam.",
    ba_single: (d) => `The comparison appears after the next night (only answer so far: ${d}).`,

    c6_h: "Nothing else is shown.",
    pledges: "<li data-n=\"01\"><b>Private conversations</b><span>No real conversation is ever published: everything you see is made up for the exam.</span></li><li data-n=\"02\"><b>Data provenance</b><span>It never learns by copying Gemini or Claude — only from open models and its user's corrections.</span></li><li data-n=\"03\"><b>Traceability</b><span>Every improvement is dated in a public log, with its Atom feed.</span></li><li data-n=\"04\"><b>Verification</b><span>A new version only takes over after an exam on questions it has never seen.</span></li><li data-n=\"05\"><b>Complete results</b><span>Failures, rejected candidates and interrupted nights are published too.</span></li>",
    c_tokens: "words written by Matthew (tokens)", c_nights: "nights of learning", c_gpu: "hours of training",
    c6_more: "Technical information ↓",

    d_h: "For the curious.", st_score: "Exam score", st_tool: "Right skill picked", st_tools: "Skills learned",
    st_ex: "Verified examples", st_changes: "Improvements (30 d)", st_streak: "Nights in a row",
    scene_aria: "3D scene: Matthew's base on the Moon, its core in the middle, one building per domain and one light per skill, Earth on the horizon. Each exam question travels from the core to the chosen skill.",
    h_exam: "The exam, day by day", p_exam: "The same exam every night. \"Never seen\": a request Matthew never met while training. Every request is made up for the exam (in French); none comes from a real conversation.",
    exam_req: "Request (made up for the exam)", exam_tool: "Expected",
    h_changes: "The improvements log", p_changes: "Everything that made it better: its intelligence, voice, interface, reliability (titles in French). The page updates itself after every improvement.",
    all: "All", more: (n) => `Show ${n} more`, changes_empty: "The first improvements are on their way.",
    h_nights: "The nights, one by one", nights_empty: "No learning night yet.", h_how: "How it learns, in detail",
    steps: "<li><b>Invent.</b> An open model writes realistic requests for each tool.</li><li><b>Verify.</b> Another model, blind, must find the right tool. Otherwise the request is thrown away.</li><li><b>Train.</b> On a home graphics card, from an open model.</li><li><b>Sit the exam.</b> On requests it has never seen, tool by tool.</li><li><b>Take over</b> only if it beats the previous version. Otherwise nothing changes.</li>",
    rules: "Rules: no real conversation is ever published here; no answer from Gemini or Claude is ever used as a model to learn from — only openly licensed models and its user's corrections.",
    dr_cases: "Its exam questions", f_updated: "Updated", f_base: "base",
    credits: "Read-only page, regenerated after every improvement · <a href=\"feed.xml\">improvements feed (Atom)</a>. Base architecture drawn in code · rocks, craters, rover, ship and astronaut: <a href=\"https://kenney.nl/assets/space-kit\">Kenney's Space Kit</a> (CC0) · <a href=\"https://polyhaven.com/a/qwantani_night_puresky\">Poly Haven</a> lighting (CC0) · Moon, Earth and Milky Way: <a href=\"https://www.solarsystemscope.com/textures/\">Solar System Scope</a> (CC BY 4.0) · type: Instrument Serif, Hanken Grotesk, JetBrains Mono (SIL OFL) · rendered with <a href=\"https://threejs.org\">three.js</a>.",
    no_data: "Today's data is not published yet.", first_exam: "First exam tonight.",
    todo: "coming", learned: "learned", never_seen: "never seen", seen_train: "seen in training",
    ok: "passed", ko: "failed", no_tool: "no tool", today: "Today", j7: "D-7",
    count: (i, n, ok, d, ms) => `${i}/${n} · ${ok} passed on ${d}${ms ? ` · ${ms} s` : ""}`,
    chosen: "chose", t_chat: "Small talk", t_none: "Polite refusal", answered: "answered without a tool",
    live_training: "Training now", epoch: (a, b) => ` — epoch ${a}/${b}`,
    next_label: "Next learning night", next_ics: "Remind me (calendar)", u_h: "h", u_m: "min", u_s: "s",
    next_when: (d, tz) => tz ? `${d} (your time) · ${tz} at Matthew's` : d,
    next_wait: "The planned time has passed: the night hasn't started yet, Matthew is waiting for its computer to wake up.",
    next_off: "Training is paused for now.",
    next_stale: (d) => `This page hasn't been updated since ${d}: Matthew's computer has stopped publishing for now. The figures above date from that day.`,
    ph_prep: "Getting ready", "ph_entraînement": "Training", ph_export: "Packaging", ph_import: "Installing",
    ph_exam: "Exam", ph_duel: "Duel with the champion",
    lv_prep: "Reading its new examples and getting the night ready.",
    lv_train: (a, b, l) => `Epoch ${a} of ${b}${l != null ? ` · loss ${l}` : ""} — the lower the loss, the better it learns.`,
    lv_export: "Training done: packing itself up so it can answer.",
    lv_import: "The new Matthew is installed next to the old one.",
    lv_exam: (d, t, r) => `The new Matthew's exam: ${d}/${t} questions, ${r} right.`,
    lv_duel: (d, t, r) => `The current champion takes the same exam: ${d}/${t}, ${r} right.`,
    toast_champ: "New champion: Matthew just got better", toast_done: "The night is over: results updated",
    ics_title: "Matthew learns (training night)",
    dr_meta: (ex, n) => `${ex} verified examples · ${n} exam${n > 1 ? "s" : ""} scored`,
    dr_soon: " · it will learn it in the coming nights", dr_none: "No exam scenario for this tool yet.",
    share: "Share", shared: "Link copied", share_text: "Watch an AI learn every night, in public.",
    q_auto: "AUTO", q_high: "HIGH", q_eco: "ECO",
    q_title: { auto: "Automatic quality: the page lightens itself if the computer struggles", high: "High quality: every effect", eco: "Eco quality: for modest computers" },
    q_toast: "The page lightened itself to stay smooth (AUTO button at the top)",
    tour_btn: "Guided tour by Matthew",
    sp_k: "Its specialties", sp_h: "It only takes a task once it has earned it.",
    sp_p: "Matthew doesn't replace everything at once. Each kind of task has its own test. It only takes one over if it reaches the bar and does at least as well as the model it would replace.",
    sp_on: "it handles it", sp_off: "not yet", sp_ref: (r) => ` · reference ${r}`, sp_floor: (f) => `bar ${f}`,
    sp_n: (n) => `${n} scored cases`,
    g_skip: "Skip the tour", g_next: "Next", g_end: "Finish", g_voice: "Matthew's voice",
    g: {
      hello: "Hello. I'm Matthew, an artificial intelligence that learns a little more every night. Shall I show you around my base?",
      base: "In real life I live on a home computer. Here I'm shown as a base on the Moon. The green light in the middle is my mind.",
      skills: "Every light around me is a skill. Green: I've got it. Off: not learned yet. Pick a domain to fly there.",
      spec: "I'm specialising bit by bit: I only take a task over once a test proves I do it well.",
      night: "Every night I train on new examples, always in six steps. They light up here when a night is under way.",
      night_live: "In fact, I'm training right now. You can follow every step here, live.",
      exam: "Then I sit an exam: made-up questions, often ones I've never seen.",
      score: (s) => `At my last exam: ${s} right answers. Here is what the exam measures, criterion by criterion.`,
      evo: "A new version of me only takes over if it does better. Rejected candidates stay on display: nothing is hidden.",
      bye: "Nothing private here: everything you see is made up for the exam. The \"Tour\" button at the top calls me back. Enjoy exploring.",
    },
  },
};
function pickLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "en" || q === "fr") return q;
  try { const s = localStorage.getItem("matthew-lang"); if (s === "en" || s === "fr") return s; } catch { /* stockage indisponible */ }
  return (navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en";
}
const LANG = pickLang();
const LOC = LANG === "fr" ? "fr-FR" : "en-GB";
const T = (k, ...a) => { const v = I18N[LANG][k] ?? I18N.fr[k] ?? k; return typeof v === "function" ? v(...a) : v; };
const G = (k, ...a) => { const v = I18N[LANG].g[k] ?? I18N.fr.g[k]; return typeof v === "function" ? v(...a) : v; };
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};

// ── Qualité : la page s'adapte à la machine ──────────────────────────────────
// « auto » (défaut) : un niveau deviné d'après la machine, puis la page s'allège seule si les
// images tardent. « high » et « eco » fixent le niveau (bouton en haut, ou ?q=high|eco|auto).
// Niveaux : 3 tout (halo, ombres fines, définition 1,5) · 2 ombres, sans halo, définition 1,25
// · 1 sans ombres, définition 1 et 30 images/s · 0 définition 0,75, étiquettes des outils masquées.
const QUALITIES = ["auto", "eco", "high"];
function pickQuality() {
  const q = new URLSearchParams(location.search).get("q");
  if (QUALITIES.includes(q)) return q;
  const s = store.get("matthew-quality");
  return QUALITIES.includes(s) ? s : "auto";
}
let QUALITY = pickQuality();
function guessLevel() {
  if (QUALITY === "high") return 3;
  if (QUALITY === "eco") return 1;
  let lvl = TOUCH || innerWidth < 860 ? 1 : 3;
  const mem = navigator.deviceMemory, cpu = navigator.hardwareConcurrency;
  if ((mem && mem <= 4) || (cpu && cpu <= 4) || (navigator.connection && navigator.connection.saveData)) lvl = Math.min(lvl, 1);
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    const ext = gl && gl.getExtension("WEBGL_debug_renderer_info");
    const gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    if (/swiftshader|llvmpipe|software|basic render/i.test(gpu)) lvl = 0;
    // Puces graphiques intégrées : sans halo d'emblée (l'adaptatif descend plus bas si besoin).
    else if (/intel|mali|adreno|powervr|videocore|vega \d+ graphics|radeon\(tm\) graphics/i.test(gpu) && !/\barc\b/i.test(gpu)) lvl = Math.min(lvl, 2);
    const lose = gl && gl.getExtension("WEBGL_lose_context");
    if (lose) lose.loseContext();
  } catch { /* pas de WebGL : la scène ne démarrera pas */ }
  return lvl;
}
function setQualityClasses(level) {
  document.documentElement.classList.toggle("lite", level <= 1);
  document.documentElement.classList.toggle("minimal", level === 0);
}
const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString(LOC, { day: "numeric", month: "short" });
const fmtDateY = (d) => new Date(d + "T12:00:00").toLocaleDateString(LOC, { day: "numeric", month: "short", year: "numeric" });
const DOM_EN = { "Système": "System", "Bureau": "Desktop", "Infos": "Info", "Communication": "Messages", "Mémoire": "Memory", "Code": "Code", "Noyau": "Core", "Autres": "Other" };
const AREA_EN = { "IA": "AI", "Interface": "Interface", "Voix": "Voice", "Fiabilité": "Reliability", "Système": "System" };
// Toutes les issues que flywheel._finish peut écrire (matthew/flywheel.py).
const OUTCOME_EN = { "nouveau champion": "new champion", "candidat non promu": "candidate not promoted", "en attente de données": "waiting for data",
  "plan prêt (à sec)": "plan ready (dry run)", "échec entraînement": "training failed", "échec données": "data step failed",
  "échec import Ollama": "import failed", "échec promotion": "promotion failed", "occupé": "busy",
  "retour arrière": "rolled back", "interrompu": "interrupted" };
const label = (t) => (LANG === "en" ? t.label_en || t.label : t.label);
const dom = (d) => (LANG === "en" ? DOM_EN[d] || d : d);
const area = (a) => (LANG === "en" ? AREA_EN[a] || a : a);
const outcome = (o) => (LANG === "en" ? OUTCOME_EN[o] || o : o);

let DATA = null;
let SCENE = null;
const toolName = (id) => {
  if (id === "__chat__") return T("t_chat");
  if (id === "__none__") return T("t_none");
  const t = DATA.tools.find((x) => x.id === id);
  return t ? label(t) : id;
};

// ── Ouverture : la progression affichée est celle du vrai chargement ─────────
const LD = { data: 0, scene: 0 };
function ldSet(k, v) {
  LD[k] = Math.max(LD[k], clamp(v, 0, 1));
  const p = LD.data * 0.15 + LD.scene * 0.85;
  $("ld-num").textContent = String(Math.round(p * 100)).padStart(3, "0");
  $("ld-bar").style.width = (p * 100).toFixed(1) + "%";
}
function ready() {
  if (document.body.classList.contains("ready")) return;
  ldSet("data", 1); ldSet("scene", 1);
  document.body.classList.add("ready");
  setTimeout(() => document.body.classList.add("gone"), REDUCED ? 0 : 1500);
  if (SCENE) SCENE.arrive();
}

function applyStatic() {
  document.documentElement.lang = LANG;
  document.title = T("doc_title");
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = T(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-html]")) el.innerHTML = T(el.dataset.i18nHtml);
  for (const el of document.querySelectorAll("[data-i18n-aria]")) el.setAttribute("aria-label", T(el.dataset.i18nAria));
  // Le titre, lettre par lettre : chacune monte de derrière sa ligne à l'ouverture.
  $("titre").querySelector(".word").innerHTML = [..."MATTHEW"].map((c, k) => `<span class="ch" style="--k:${k}" aria-hidden="true">${c}</span>`).join("");
  for (const ch of document.querySelectorAll(".chapter")) {
    [...ch.querySelectorAll("[data-reveal]")].forEach((el, i) => el.style.setProperty("--i", i));
  }
  const b = $("lang");
  b.textContent = LANG === "fr" ? "EN" : "FR";
  b.setAttribute("aria-label", LANG === "fr" ? "English version" : "Version française");
  b.onclick = () => {
    store.set("matthew-lang", LANG === "fr" ? "en" : "fr");
    const u = new URL(location.href); u.searchParams.set("lang", LANG === "fr" ? "en" : "fr"); location.href = u.toString();
  };
  if (OG) document.body.classList.add("og");
  $("tour-btn").title = T("tour_btn");
  renderQualityBtn();
  $("share").onclick = async () => {
    const url = location.origin + location.pathname;
    if (navigator.share) {
      try { await navigator.share({ title: T("doc_title"), text: T("share_text"), url }); } catch { /* annulé */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); toast(T("shared")); } catch { /* presse-papiers refusé */ }
  };
}

function renderQualityBtn() {
  const b = $("quality");
  b.textContent = T("q_" + QUALITY);
  b.title = I18N[LANG].q_title[QUALITY];
  b.setAttribute("aria-label", b.title);
}

async function main() {
  applyStatic();
  buildNav();
  if (OG) document.body.classList.add("ready", "gone");
  try {
    const r = await fetch("data/vitrine.json", { cache: "no-cache" });
    DATA = await r.json();
  } catch (e) {
    $("r-req").textContent = T("no_data");
    ready();
    return;
  }
  ldSet("data", 1);
  fillStats();
  fillHero();
  fillCriteria();
  fillDuel();
  drawChart();
  fillDeltas();
  fillCounters();
  fillBeforeAfter();
  fillDomains();
  fillDomIndex();
  fillExam();
  fillNights();
  fillChanges();
  fillLive();
  fillNext();
  fillSpecs();
  watchData();
  const closeTool = () => { $("drawer").hidden = true; history.replaceState(null, "", location.pathname + location.search); };
  $("dr-close").onclick = closeTool;
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("drawer").hidden) closeTool(); });
  let resizeT = 0;
  addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(drawChart, 200); });

  const timeline = startTimeline();
  startReplay();
  startStory(timeline);
  // La page ne fait jamais attendre plus de 8 s : passé ce délai, la scène finit de se charger derrière.
  const giveUp = setTimeout(ready, 8000);
  const scene = await startScene((p) => ldSet("scene", p)).catch((e) => {
    console.warn("3D indisponible :", e);
    $("scene").classList.add("flat");
    return null;
  });
  SCENE = scene;
  const pick = (id) => { if (scene && !REDUCED) scene.flyToTool(id, () => openTool(id)); else openTool(id); };
  $("domains").addEventListener("click", (e) => { const t = e.target.closest("[data-tool]"); if (t) { openTool(t.dataset.tool); if (scene) scene.flyToTool(t.dataset.tool); } });
  $("domains").addEventListener("keydown", (e) => { const t = e.target.closest("[data-tool]"); if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openTool(t.dataset.tool); } });
  $("dom-index").addEventListener("click", (e) => {
    const b = e.target.closest("[data-dom]");
    if (!b) return;
    if (scene) scene.flyToDomain(b.dataset.dom); else { const d = document.querySelector(".all-skills"); d.open = true; }
  });
  if (scene) {
    scene.onPick(pick);
    scene.setStory(STORY.shots);
    scene.setProgress(STORY.progress());
    if (DATA.live) scene.setLive(true);
  }
  if (location.hash.startsWith("#outil-")) pick(decodeURIComponent(location.hash.slice(7)));
  clearTimeout(giveUp);
  // Délai dépassé : la page est déjà ouverte, la scène arrive en fondu dès qu'elle est prête.
  if (document.body.classList.contains("ready")) { if (scene) scene.arrive(); } else ready();
  $("quality").onclick = () => {
    QUALITY = QUALITIES[(QUALITIES.indexOf(QUALITY) + 1) % QUALITIES.length];
    store.set("matthew-quality", QUALITY);
    renderQualityBtn();
    if (scene) scene.setQuality(); else setQualityClasses(guessLevel());
  };
  // Première visite : Matthew se présente lui-même (une seule fois ; « Visite » le rappelle).
  $("tour-btn").onclick = () => startGuide();
  if (!OG && store.get("matthew-tour") !== "1" && !new URLSearchParams(location.search).has("notour")) {
    setTimeout(() => startGuide(), REDUCED ? 300 : 2600);
  }
}

// ── Navigation : rail des chapitres, index plein écran, progression ───────────
function chapterEls() { return [...document.querySelectorAll("section[data-n]")].filter((el) => !el.hidden); }
function buildNav() {
  const items = chapterEls().map((el) => ({ id: el.id, n: el.dataset.n, t: T(el.dataset.i18nChap) }));
  $("rail-list").innerHTML = items.map((c) => `<li><a href="#${c.id}" data-for="${c.id}"><span class="t">${esc(c.t)}</span><span>${c.n}</span></a></li>`).join("");
  $("index-list").innerHTML = items.map((c) => `<li><a href="#${c.id}" data-for="${c.id}"><span>${c.n}</span>${esc(c.t)}</a></li>`).join("");
  const menu = $("menu-btn"), index = $("index");
  const setMenu = (open) => {
    index.hidden = !open;
    menu.setAttribute("aria-expanded", String(open));
    menu.textContent = open ? T("menu_close") : T("menu");
    if (open) index.querySelector("a").focus();
  };
  menu.onclick = () => setMenu(index.hidden);
  index.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !index.hidden) { setMenu(false); menu.focus(); } });
}

// Ses spécialités (Direction 3) : chaque type de tâche a son épreuve, son seuil et sa référence.
function fillSpecs() {
  const S = DATA.specialties;
  $("c-spec").hidden = !(Array.isArray(S) && S.length);
  if ($("c-spec").hidden) return;
  $("specs").innerHTML = S.map((s) => {
    const w = Math.round((s.score ?? 0) * 100), f = Math.round((s.floor ?? 0) * 100);
    const detail = T("sp_floor", pct(s.floor)) + (s.reference != null ? T("sp_ref", pct(s.reference)) : "") + (s.n ? " · " + T("sp_n", s.n) : "");
    return `<li class="${s.delegated ? "on" : ""}"><span>${esc(LANG === "en" ? s.label_en || s.label : s.label)}<span class="st">${esc(T(s.delegated ? "sp_on" : "sp_off"))}</span></span>`
      + `<span class="sv">${s.score == null ? "—" : pct(s.score)}</span><span class="bar"><i style="width:${w}%"></i><b style="left:${f}%"></b></span>`
      + `<span class="sd">${esc(detail)}</span></li>`;
  }).join("");
}

// L'arrivée et le noyau : quelques chiffres, en mots simples.
function fillHero() {
  const c = DATA.champion, s = c && c.score, cov = DATA.coverage;
  $("h-score").textContent = s && s.composite != null ? pct(s.composite) : "—";
  $("h-tools").textContent = `${cov.tools_covered}/${cov.tools_total}`;
  $("h-since").textContent = c && c.since ? fmtDate(c.since) : "—";
  $("f-skills").textContent = cov.tools_covered;
  $("f-total").textContent = cov.tools_total;
  $("k-base").textContent = c && c.base ? c.base : "—";
  $("k-since").textContent = c && c.since ? fmtDateY(c.since) : "—";
  $("k-ex").textContent = cov.examples.toLocaleString(LOC);
  const live = !!DATA.live;
  $("brand-dot").classList.toggle("on", live);
  $("kick-dot").classList.toggle("on", live);
}

// Le récit : la position dans la page devient une position sur le chemin de la caméra (un plan
// par chapitre) ; le rail dit où l'on est ; la frise se rejoue d'elle-même au chapitre des nuits.
const STORY = { els: [], shots: [], progress: () => 0 };
function startStory(timeline) {
  const chapters = [...document.querySelectorAll(".chapter:not([hidden])")];
  STORY.els = chapters;
  STORY.shots = chapters.map((c) => c.dataset.shot);
  const navs = chapterEls();
  STORY.progress = () => {
    const y = innerHeight / 2;
    const centers = chapters.map((c) => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; });
    if (y <= centers[0]) return 0;
    for (let i = 0; i < centers.length - 1; i++) {
      if (y < centers[i + 1]) return i + (y - centers[i]) / (centers[i + 1] - centers[i]);
    }
    return centers.length - 1;
  };
  // Apparition des textes : une fois, quand le chapitre entre à l'écran.
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { threshold: 0.12 });
  chapters.forEach((c) => io.observe(c));
  let played = false, ticking = false, current = null;
  const update = () => {
    ticking = false;
    const mid = innerHeight / 2;
    const now = navs.find((el) => { const r = el.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; }) || navs[0];
    if (now !== current) {
      current = now;
      for (const a of document.querySelectorAll("[data-for]")) a.setAttribute("aria-current", String(a.dataset.for === now.id));
      document.body.dataset.side = now.dataset.side || "none";
      document.body.dataset.shot = now.dataset.shot || "far";
      if (now.dataset.shot === "night" && timeline && !played) { played = true; timeline.play(); }
    }
    const max = document.documentElement.scrollHeight - innerHeight;
    $("rail-fill").style.height = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
    if (SCENE) SCENE.setProgress(STORY.progress());
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();
}

// ── Chiffres ─────────────────────────────────────────────────────────────────
function fillStats() {
  const c = DATA.champion, s = c && c.score, cov = DATA.coverage;
  $("s-score").textContent = s && s.composite != null ? s.composite.toFixed(2) : "—";
  $("s-tool").textContent = pct(s && s.tool_name);
  $("s-tools").textContent = `${cov.tools_covered}/${cov.tools_total}`;
  $("s-ex").textContent = cov.examples.toLocaleString(LOC);
  const month = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  $("s-changes").textContent = (DATA.changes || []).filter((c) => c.date >= month).length || "—";
  $("gen").textContent = DATA.generated;
  $("base").textContent = c ? c.base : "—";
}

// Ce que l'examen mesure : les composantes réelles du score du champion en service.
function fillCriteria() {
  const s = DATA.champion && DATA.champion.score, box = $("criteria");
  if (!s) { box.innerHTML = ""; return; }
  const sec = (v) => (v == null ? "—" : v.toLocaleString(LOC, { maximumFractionDigits: 1 }) + " s");
  const keys = ["composite", "tool_name", "tool_args", "irrelevance", "valid", "latency_p50"];
  box.innerHTML = `<p class="crit-h mono">${esc(T("crit_h"))}</p>` + keys.map((k) =>
    `<div class="crit${k === "composite" ? " main" : ""}"><b>${k === "latency_p50" ? sec(s[k]) : pct(s[k])}</b><span>${esc(T("cr_" + k))}</span><small>${esc(T("crd_" + k))}</small></div>`).join("");
}

// Champion contre candidat : pour chaque candidat publié, le champion qu'il affrontait
// (le dernier candidat promu avant lui). Rien n'est déduit au-delà de l'historique.
function duels() {
  const out = [];
  let ref = null;
  for (const h of DATA.history) {
    if (!h.score) continue;
    out.push({ h, ref });
    if (h.promoted) ref = h;
  }
  return out;
}

function fillDuel() {
  const rows = duels().slice().reverse().slice(0, 8), box = $("duel");
  if (!rows.length) { box.innerHTML = `<p class="muted small">${esc(T("du_none"))}</p>`; return; }
  const sc = (h) => (h && h.score && h.score.composite != null ? pct(h.score.composite) : "—");
  box.innerHTML = `<div class="duel-row duel-head"><span>${esc(T("du_date"))}</span><span>${esc(T("du_cand"))}</span><span>${esc(T("du_ref"))}</span><span></span></div>`
    + rows.map(({ h, ref }) => `<div class="duel-row${h.promoted ? " win" : ""}"><span class="d">${fmtDate(h.date)}</span>`
      + `<span class="s">${sc(h)}</span><span class="s ref">${ref ? sc(ref) : "—"}${ref ? `<small>${fmtDate(ref.date)}</small>` : `<small>${esc(T("du_noref"))}</small>`}</span>`
      + `<span class="v">${esc(T(h.promoted ? "du_win" : "du_lose"))}</span></div>`).join("");
}

// Progrès et reculs savoir-faire par savoir-faire : le dernier candidat face à son champion.
function fillDeltas() {
  const box = $("deltas");
  const d = duels().filter(({ h, ref }) => ref && h.per_tool && ref.per_tool && Object.keys(h.per_tool).length).pop();
  if (!d) { box.innerHTML = `<p class="note">${esc(T("dl_noref"))}</p>`; return; }
  const diff = [];
  for (const [id, v] of Object.entries(d.h.per_tool)) {
    const r = d.ref.per_tool[id];
    if (typeof r === "number" && Math.abs(v - r) >= 0.005) diff.push([id, v - r]);
  }
  const up = diff.filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const down = diff.filter((x) => x[1] < 0).sort((a, b) => a[1] - b[1]).slice(0, 6);
  const pts = (x) => (x > 0 ? "+" : "−") + Math.abs(Math.round(x * 100)) + " pts";
  const list = (xs, cls) => xs.length ? `<ul>${xs.map(([id, x]) => `<li class="${cls}"><span>${esc(toolName(id))}</span><b>${pts(x)}</b></li>`).join("")}</ul>`
    : `<p class="none">${esc(T("dl_none"))}</p>`;
  const tag = (h) => `${fmtDate(h.date)}, ${pct(h.score.composite)}`;
  box.innerHTML = `<p class="note">${esc(T("dl_note", tag(d.h), tag(d.ref)))}</p>`
    + `<div><h4>${esc(T("dl_up"))}</h4>${list(up, "up")}</div><div><h4>${esc(T("dl_down"))}</h4>${list(down, "down")}</div>`;
}

// Compteurs vivants : ils comptent jusqu'à leur valeur quand ils entrent à l'écran.
function fillCounters() {
  const c = DATA.counters || {};
  const set = [["c-tokens", c.tokens || 0, 0], ["c-gpu", c.gpu_hours || 0, 1], ["c-nights", c.nights || 0, 0], ["c-streak", c.streak || 0, 0]];
  const run = () => {
    for (const [id, v, dec] of set) {
      const el = $(id), t0 = performance.now(), dur = REDUCED ? 0 : 1800;
      (function step(now) {
        const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
        el.textContent = (v * e).toLocaleString(LOC, { minimumFractionDigits: dec, maximumFractionDigits: dec });
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }
  };
  const band = document.querySelector(".counters");
  if (!("IntersectionObserver" in window)) return run();
  const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); run(); } }, { threshold: 0.3 });
  io.observe(band);
}

// La courbe : chaque candidat (plein = promu, creux = rejeté) et, en escalier, le champion en service.
function drawChart() {
  const svg = $("chart"), W = Math.max(320, svg.clientWidth || 640), H = 230, P = { l: 44, r: 12, t: 14, b: 30 };
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const pts = duels().map((d) => d.h);
  const vals = pts.map((h) => h.score.composite).filter((v) => v != null);
  const lo = vals.length ? Math.max(0, Math.floor((Math.min(...vals) - 0.05) * 20) / 20) : 0;
  const x = (i) => P.l + (pts.length < 2 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (pts.length - 1));
  const y = (v) => P.t + (1 - (v - lo) / (1 - lo || 1)) * (H - P.t - P.b);
  const SIG = "#B6E3C5", SIL = "#B8B8B8", MIN = "#777777";
  let g = "";
  const step = (1 - lo) / 4;
  for (let k = 0; k <= 4; k++) {
    const v = lo + k * step;
    g += `<line class="axis" x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${P.l - 10}" y="${y(v) + 3}" text-anchor="end">${Math.round(v * 100)}</text>`;
  }
  let champ = null, path = "";
  pts.forEach((h, i) => {
    if (h.promoted && h.score.composite != null) {
      if (champ != null) path += ` L${x(i)},${y(champ)}`;
      champ = h.score.composite;
      path += (path ? " L" : "M") + `${x(i)},${y(champ)}`;
    }
  });
  if (champ != null && pts.length > 1) path += ` L${W - P.r},${y(champ)}`;
  if (path) g += `<path d="${path}" fill="none" stroke="${SIL}" stroke-width="1.2"/>`;
  pts.forEach((h, i) => {
    const v = h.score.composite;
    if (v == null) return;
    g += h.promoted
      ? `<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="${SIG}"><title>${fmtDate(h.date)} — ${pct(v)}</title></circle>`
      : `<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="#050505" stroke="${MIN}" stroke-width="1.5"><title>${fmtDate(h.date)} — ${pct(v)}</title></circle>`;
    g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${fmtDate(h.date)}</text>`;
  });
  if (pts.length === 1) g += `<text x="${W / 2}" y="${P.t + 12}" text-anchor="middle">${esc(T("first_night"))}</text>`;
  svg.innerHTML = `<title id="chart-t">${esc(T("chart_title"))}</title>` + g;
  $("legend").innerHTML = `<span><i style="background:${SIL};border-radius:0;height:1px;width:16px;vertical-align:3px"></i>${esc(T("lg_champ"))}</span>`
    + `<span><i style="background:${SIG}"></i>${esc(T("lg_win"))}</span><span><i style="border:1.5px solid ${MIN}"></i>${esc(T("lg_lose"))}</span>`;
}

// Avant / après : la même phrase, deux nuits, deux réponses (scénarios synthétiques).
function fillBeforeAfter() {
  const box = $("ba");
  const cards = DATA.showcase.filter((s) => s.target === "__chat__" || s.target === "__none__")
    .map((s) => ({ s, days: Object.entries(s.results).filter(([, r]) => r.answer).sort((a, b) => a[0].localeCompare(b[0])) }))
    .filter((c) => c.days.length);
  if (!cards.length) { box.innerHTML = `<p class="muted small">${esc(T("ba_empty"))}</p>`; return; }
  box.innerHTML = cards.slice(0, 3).map(({ s, days }) => {
    const last = days[days.length - 1];
    const weekAgo = new Date(new Date(last[0] + "T12:00:00") - 7 * 864e5).toISOString().slice(0, 10);
    const first = days.filter(([d]) => d <= weekAgo).pop() || days[0];
    const col = ([d, r]) => `<div class="ba-col"><span class="label mono">${fmtDate(d)}</span><p>${esc(r.answer)}</p></div>`;
    return `<article class="ba-card"><p class="ba-q">« ${esc(s.request)} » <span class="badge ghost">${esc(toolName(s.target))}</span></p>
      <div class="ba-cols">${first[0] === last[0] ? col(last) + `<div class="ba-col wait"><p class="muted">${esc(T("ba_single", fmtDate(last[0])))}</p></div>` : col(first) + col(last)}</div></article>`;
  }).join("");
}

function domainsWithTools() { return DATA.domains.filter((d) => DATA.tools.some((t) => t.domain === d)); }

// L'index des domaines : chacun fait voler la caméra jusqu'à son bâtiment.
function fillDomIndex() {
  $("dom-index").innerHTML = domainsWithTools().map((d) => {
    const ts = DATA.tools.filter((t) => t.domain === d), l = ts.filter((t) => t.examples > 0).length;
    return `<li><button type="button" data-dom="${esc(d)}"><span>${esc(dom(d))}</span><span class="n">${l}/${ts.length}</span>`
      + `<span class="m"><i style="width:${Math.round((l / ts.length) * 100)}%"></i></span></button></li>`;
  }).join("");
}

function fillDomains() {
  const box = $("domains");
  box.innerHTML = "";
  for (const d of DATA.domains) {
    const tools = DATA.tools.filter((t) => t.domain === d);
    if (!tools.length) continue;
    tools.sort((a, b) => (b.accuracy ?? -1) - (a.accuracy ?? -1));
    const learned = tools.filter((t) => t.examples > 0).length;
    box.insertAdjacentHTML("beforeend", `<div class="domain"><h3><span>${esc(dom(d))}</span><span>${learned}/${tools.length}</span></h3>${tools
      .map((t) => {
        const todo = !t.examples;
        const v = todo ? T("todo") : t.accuracy == null ? T("learned") : pct(t.accuracy);
        const w = todo ? 0 : Math.round((t.accuracy ?? 1) * 100);
        return `<div class="tool${todo ? " todo" : ""}" tabindex="0" role="button" data-tool="${esc(t.id)}"><span>${esc(label(t))}</span><span class="v">${v}</span><span class="bar"><i style="width:${w}%"></i></span></div>`;
      }).join("")}</div>`);
  }
}

function examDays() {
  const s = new Set();
  for (const sc of DATA.showcase) for (const d of Object.keys(sc.results)) s.add(d);
  return [...s].sort();
}

function fillExam() {
  const days = examDays().slice(-7);
  let h = `<thead><tr><th scope="col">${esc(T("exam_req"))}</th><th scope="col">${esc(T("exam_tool"))}</th>${days.map((d) => `<th scope="col" class="c">${fmtDate(d)}</th>`).join("")}</tr></thead><tbody>`;
  for (const s of DATA.showcase) {
    h += `<tr><td>${esc(s.request)}${s.heldout ? ` <span class="badge ghost">${esc(T("never_seen"))}</span>` : ""}</td><td>${esc(toolName(s.target))}</td>${days
      .map((d) => {
        const r = s.results[d];
        if (!r) return `<td class="c">·</td>`;
        const title = r.chosen ? `${T("chosen")} : ${toolName(r.chosen)}` : T("answered");
        return `<td class="c ${r.ok ? "ok" : "ko"}" title="${esc(title)}">${r.ok ? "✓" : "✗"}</td>`;
      }).join("")}</tr>`;
  }
  $("exam").innerHTML = h + "</tbody>";
}

function fillNights() {
  const ol = $("nights");
  const rows = [...DATA.cycles].reverse().slice(0, 14);
  ol.innerHTML = rows.length ? "" : `<li>${esc(T("nights_empty"))}</li>`;
  for (const c of rows) {
    const win = /champion/.test(c.outcome);
    ol.insertAdjacentHTML("beforeend", `<li><span>${fmtDate(c.date)}</span><span class="o${win ? " win" : ""}">${esc(outcome(c.outcome))}</span></li>`);
  }
}

function fillChanges() {
  const all = DATA.changes || [], chips = $("chips"), ol = $("changes");
  const areas = ["*", ...new Set(all.map((c) => c.area))];
  let sel = "*", shown = 25;
  function render() {
    const rows = all.filter((c) => sel === "*" || c.area === sel);
    ol.innerHTML = rows.slice(0, shown).map((c) => `<li data-area="${esc(c.area)}"><span class="d">${fmtDate(c.date)}</span><span>${esc(c.title)}</span><span class="a">${esc(area(c.area))}</span></li>`).join("")
      + (rows.length > shown ? `<li class="more"><button type="button" id="more">${esc(T("more", rows.length - shown))}</button></li>` : "");
    const more = $("more"); if (more) more.onclick = () => { shown = rows.length; render(); };
  }
  chips.innerHTML = "";
  for (const a of areas) {
    const b = document.createElement("button"); b.type = "button"; b.dataset.area = a;
    b.textContent = a === "*" ? T("all") : area(a); b.setAttribute("aria-pressed", String(a === sel));
    b.onclick = () => { sel = a; shown = 25; for (const x of chips.children) x.setAttribute("aria-pressed", String(x.dataset.area === a)); render(); };
    chips.appendChild(b);
  }
  if (!all.length) ol.innerHTML = `<li>${esc(T("changes_empty"))}</li>`; else render();
}

function spark(svg, values, w, h, color) {
  const v = values.filter((x) => x != null);
  if (!v.length) { svg.innerHTML = ""; return; }
  const lo = Math.min(...v), hi = Math.max(...v), span = hi - lo || 1;
  const pts = v.map((x, i) => [v.length < 2 ? w / 2 : 4 + (i * (w - 8)) / (v.length - 1), h - 8 - ((x - lo) / span) * (h - 16)]);
  svg.innerHTML = (pts.length > 1 ? `<polyline fill="none" stroke="${color}" stroke-width="1.5" points="${pts.map((q) => q.join(",")).join(" ")}"/>` : "")
    + pts.map((q) => `<circle cx="${q[0]}" cy="${q[1]}" r="3" fill="${color}"/>`).join("");
}

const PHASES = ["prep", "entraînement", "export", "import", "exam", "duel"];

// Le cycle d'une nuit : les six vraies étapes ; seules celles d'une nuit en cours s'allument.
function fillLive() {
  const L = DATA.live;
  const at = L ? PHASES.indexOf(L.phase) : -1;
  $("phases").innerHTML = PHASES.map((p, i) =>
    `<li class="${L && i < at ? "done" : L && i === at ? "now" : ""}"><span class="no">${String(i + 1).padStart(2, "0")}</span><span class="nm">${esc(T("ph_" + p))}</span></li>`).join("");
  $("live-line").hidden = !L;
  $("livebox").hidden = !L;
  $("cycle-idle").textContent = L ? "" : T("cycle_idle");
  $("brand-dot").classList.toggle("on", !!L);
  $("kick-dot").classList.toggle("on", !!L);
  if (SCENE) SCENE.setLive(!!L);
  if (!L) return;
  const ep = L.phase === "entraînement" && L.epoch != null && L.epochs
    ? T("epoch", Math.min(Math.ceil(L.epoch), L.epochs), L.epochs) : "";
  $("live-text").textContent = (L.phase === "entraînement" ? T("live_training") : T("ph_" + L.phase)) + ep;
  let frac = 0, text = "";
  const last = (L.losses || []).at(-1);
  if (L.phase === "entraînement") {
    frac = L.epochs ? Math.min(1, (L.epoch || 0) / L.epochs) : 0;
    text = T("lv_train", Math.min(Math.ceil(L.epoch || 0), L.epochs || 0), L.epochs || 0, last != null ? last.toFixed(3) : null);
  } else if (L.phase === "exam" || L.phase === "duel") {
    frac = L.total ? L.done / L.total : 0;
    text = T(L.phase === "exam" ? "lv_exam" : "lv_duel", L.done || 0, L.total || 0, L.right || 0);
  } else {
    frac = { prep: 0.05, export: 1, import: 1 }[L.phase] ?? 0;
    text = T({ prep: "lv_prep", export: "lv_export", import: "lv_import" }[L.phase] || "lv_prep");
  }
  $("live-bar").style.width = Math.round(frac * 100) + "%";
  $("live-detail").textContent = text;
  // La courbe d'erreur ne raconte que l'entraînement.
  const v = ["entraînement", "export"].includes(L.phase) ? L.losses || [] : [], svg = $("live-loss");
  svg.hidden = v.length < 2;
  if (v.length >= 2) {
    const lo = Math.min(...v), hi = Math.max(...v), span = hi - lo || 1;
    const pts = v.map((x, i) => `${(i * 296) / (v.length - 1) + 2},${46 - ((x - lo) / span) * 42}`).join(" ");
    svg.innerHTML = `<polyline fill="none" stroke="#B6E3C5" stroke-width="1.5" points="${pts}"/>`;
  }
}

// ── La prochaine nuit : un vrai compte à rebours ─────────────────────────────
// data/vitrine.json → next.at vient du Planificateur de tâches du PC de Matthew (flywheel.next_run) :
// changer l'heure de la tâche change cette page à la publication suivante. Rien n'est écrit en dur.
let NEXT_TIMER = null;
const two = (n) => String(n).padStart(2, "0");

function fillNext() {
  const N = DATA.next, box = $("next");
  clearInterval(NEXT_TIMER);
  box.hidden = !N || !!DATA.live;
  if (box.hidden) return;
  if (!N.enabled || !N.at) {
    box.classList.add("waiting");
    $("cd-when").textContent = T("next_off");
    $("cd-ics").hidden = true;
    return;
  }
  const when = new Date(N.at);
  // L'heure de Matthew n'est ajoutée que si le visiteur vit dans un autre fuseau.
  const offset = -when.getTimezoneOffset(), theirs = Number(N.at.slice(20, 22)) * 60 + Number(N.at.slice(23, 25));
  const there = offset === (N.at[19] === "-" ? -theirs : theirs) ? "" : N.at.slice(11, 16);
  $("cd-when").textContent = T("next_when", when.toLocaleString(LOC, { weekday: "long", hour: "2-digit", minute: "2-digit" }), there);
  $("cd-ics").hidden = false;
  $("cd-ics").onclick = () => downloadIcs(when);
  const tick = () => {
    const left = Math.round((when - Date.now()) / 1000);
    box.classList.toggle("soon", left > 0 && left < 900);
    box.classList.toggle("waiting", left <= 0);
    if (left <= 0) {
      // Données de plus de 36 h : on ne prétend plus que la nuit va commencer, on dit depuis quand rien n'est publié.
      const gen = new Date(String(DATA.generated).replace(" ", "T"));
      const stale = Date.now() - gen > 36 * 3600 * 1000;
      $("next-label").textContent = stale ? T("f_updated") + " " + fmtDateY(DATA.generated.slice(0, 10)) : T("next_label");
      $("cd-when").textContent = stale ? T("next_stale", fmtDateY(DATA.generated.slice(0, 10))) : T("next_wait");
      $("cd-ics").hidden = true;
      return;
    }
    $("cd-h").textContent = two(Math.floor(left / 3600));
    $("cd-m").textContent = two(Math.floor((left % 3600) / 60));
    $("cd-s").textContent = two(left % 60);
  };
  tick();
  NEXT_TIMER = setInterval(tick, 1000);
}

function downloadIcs(when) {
  const z = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Matthew//vitrine//FR", "BEGIN:VEVENT",
    `UID:matthew-${z(when)}@vitrine`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(when)}`, "DURATION:PT1H",
    `SUMMARY:${T("ics_title")}`, `URL:${location.origin}${location.pathname}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "matthew.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ── Rester à jour sans recharger : toutes les minutes autour de la nuit, sinon toutes les 5 min ──
function toast(text) {
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 6000);
}

function watchData() {
  if (OG) return;
  const due = () => {
    const at = DATA.next && DATA.next.at ? new Date(DATA.next.at) - Date.now() : Infinity;
    return DATA.live || Math.abs(at) < 30 * 60 * 1000 ? 60000 : 300000;
  };
  const poll = async () => {
    if (!document.hidden) {
      try {
        // ?t= : GitHub Pages garde la page 10 min en cache ; le direct ne peut pas attendre.
        const r = await fetch(`data/vitrine.json?t=${Date.now()}`, { cache: "no-store" });
        const fresh = await r.json();
        if (fresh.generated !== DATA.generated) {
          const champ = (DATA.champion || {}).since !== (fresh.champion || {}).since;
          const ended = DATA.live && !fresh.live;
          DATA = fresh;
          fillHero(); fillStats(); fillCounters(); fillLive(); fillNext(); fillSpecs();
          fillCriteria(); fillDuel(); drawChart(); fillDeltas(); fillNights();
          if (champ) toast(T("toast_champ")); else if (ended) toast(T("toast_done"));
        }
      } catch { /* hors ligne : on réessaie au prochain tour */ }
    }
    setTimeout(poll, due());
  };
  setTimeout(poll, due());
}

function openTool(id) {
  const t = DATA.tools.find((x) => x.id === id);
  if (!t) return;
  $("dr-domain").textContent = dom(t.domain);
  $("dr-title").textContent = label(t);
  $("dr-acc").textContent = !t.examples ? T("todo") : t.accuracy == null ? T("learned") : pct(t.accuracy);
  $("dr-acc").className = "big" + (!t.examples || t.accuracy == null ? " na" : t.accuracy < 0.5 ? " low" : t.accuracy < 0.75 ? " mid" : "");
  const hist = DATA.history.filter((h) => h.per_tool && h.per_tool[id] != null);
  spark($("dr-spark"), hist.map((h) => h.per_tool[id]), 300, 70, "#B6E3C5");
  $("dr-meta").textContent = T("dr_meta", t.examples, hist.length) + (t.examples ? "" : T("dr_soon"));
  const cases = DATA.showcase.filter((x) => x.target === id);
  $("dr-cases").innerHTML = cases.length ? cases.map((c) => `<li>« ${esc(c.request)} »${c.heldout ? ` <span class="badge ghost">${esc(T("never_seen"))}</span>` : ""}<div class="days">${
    Object.entries(c.results).sort().slice(-7).map(([d, r]) => `<span class="d${r.ok ? "" : " ko"}">${fmtDate(d)} ${r.ok ? "✓" : "✗"}</span>`).join(" ")}</div></li>`).join("")
    : `<li class="muted">${esc(T("dr_none"))}</li>`;
  $("drawer").hidden = false;
  $("dr-close").focus();
  history.replaceState(null, "", `${location.pathname}${location.search}#outil-${id}`);
}

// Frise des nuits : un curseur dans le temps ; la base se rallume au fil des outils appris.
function startTimeline() {
  const days = [...new Set([...DATA.tools.map((t) => t.learned_on).filter(Boolean),
    ...DATA.history.map((h) => h.date), ...DATA.cycles.map((c) => c.date)])].sort();
  if (!days.length) return null;
  $("timeline").hidden = false;
  const range = $("tl-range");
  range.max = String(days.length - 1);
  range.value = String(days.length - 1);
  const show = (i) => {
    const d = days[i];
    const n = DATA.tools.filter((t) => t.learned_on && t.learned_on <= d).length;
    const h = [...DATA.history].filter((x) => x.date <= d && x.score).pop();
    $("tl-day").textContent = fmtDate(d);
    $("tl-sum").textContent = T("tl_sum", n, DATA.tools.length, h ? h.score.composite : null);
    if (SCENE) SCENE.setDay(d);
  };
  range.addEventListener("input", () => show(+range.value));
  let timer = null;
  const stop = () => { clearInterval(timer); timer = null; $("tl-play").textContent = T("tl_play"); };
  const play = () => {
    if (timer) return stop();
    let i = 0;
    $("tl-play").textContent = T("tl_stop");
    show(i); range.value = "0";
    timer = setInterval(() => {
      i++;
      if (i >= days.length) return stop();
      range.value = String(i); show(i);
    }, days.length > 12 ? 600 : 1300);
  };
  $("tl-play").onclick = play;
  show(days.length - 1);
  return { play: () => { if (!timer && days.length > 1) play(); } };
}

// ── Scène 3D ─────────────────────────────────────────────────────────────────
// Un plan par chapitre : [position de la caméra, point regardé]. Le scroll avance sur le chemin
// qui les relie (Catmull-Rom) ; chaque chapitre a son temps de pose.
// Le sujet se place du côté opposé au texte : le point regardé est décalé d'autant.
const SHOTS = {
  overview: [[20, 7, 46], [-14, 3, 6]], base: [[7, 7.5, 12], [-2.6, 4, 1.5]],
  domains: [[-19, 11, 14], [-2, 1.4, 3]], night: [[0.6, 31, 9], [0, 0, 0]],
  exam: [[7.5, 6.6, 10], [2.8, 3.6, -2.1]], progress: [[6, 7, 24], [-42.6, 19.6, -42.1]],
  far: [[0, 25, 52], [0, 0, 0]],
};
// La Terre : à 5,5° au-dessus de l'horizon et 12° à droite de l'axe dans le plan d'arrivée.
const EARTH_POS = [-122, 36, -217];

async function startScene(onProgress) {
  const host = $("scene");
  const probe = document.createElement("canvas");
  if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) throw new Error("pas de WebGL");
  const THREE = await import("three");
  const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
  const { CSS2DRenderer, CSS2DObject } = await import("three/addons/renderers/CSS2DRenderer.js");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const { RGBELoader } = await import("three/addons/loaders/RGBELoader.js");
  const small = innerWidth < 860;
  let composer = null;
  // La définition de rendu par niveau (voir guessLevel) : 2 en plein écran avec halo saturait
  // les ordinateurs modestes ; 1,5 se distingue à peine sur un écran haute densité.
  const PR = [0.75, 1, 1.25, 1.5];
  // La capture de partage tourne en rendu logiciel (niveau 0 deviné) : on la veut belle, pas fluide.
  let level = OG ? 2 : guessLevel();
  setQualityClasses(level);

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_u, done, total) => onProgress && onProgress(done / total);
  const loaded = new Promise((res) => { manager.onLoad = res; manager.onError = () => {}; });

  const renderer = new THREE.WebGLRenderer({ antialias: level >= 2 && !small, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: OG });
  renderer.setPixelRatio(Math.min(devicePixelRatio, PR[level]));
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = level >= 2;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.opacity = "0";
  renderer.domElement.style.transition = REDUCED ? "none" : "opacity 2.2s cubic-bezier(.2,.7,.1,1)";
  host.appendChild(renderer.domElement);
  const labels = new CSS2DRenderer();
  labels.domElement.style.cssText = "position:absolute;inset:0;pointer-events:none";
  host.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  // Pas d'air sur la Lune : ce voile ne sert qu'à séparer les plans au loin.
  scene.fog = new THREE.Fog(0x050505, 80, 240);
  const camera = new THREE.PerspectiveCamera(small ? 50 : 40, 1, 0.1, 1400);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.06; controls.enablePan = false;
  // La scène est le fond de la page : la molette et le doigt font défiler, pas zoomer.
  controls.enableZoom = false;
  if (small || TOUCH) { controls.enabled = false; renderer.domElement.style.touchAction = "pan-y"; }
  controls.minDistance = 6; controls.maxDistance = 70; controls.maxPolarAngle = Math.PI * 0.48;

  const SIGNAL = new THREE.Color(0xB6E3C5), SILVER = new THREE.Color(0xB8B8B8), DIM = new THREE.Color(0x2a2a2a);
  const tex = new THREE.TextureLoader(manager);

  // ── Lumière : un soleil rasant, sans atmosphère — ombres longues et noires, comme sur les
  // photos Apollo. Le ciel HDR ne sert qu'aux reflets des métaux.
  new RGBELoader(manager).load("assets/sky/night_1k.hdr", (hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    scene.environmentIntensity = 0.16;
    hdr.dispose(); pmrem.dispose();
  });
  scene.add(new THREE.HemisphereLight(0x9aa3b0, 0x050505, 0.12));
  tex.load("assets/space/2k_stars_milky_way.jpg", (t) => {
    t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
    scene.background = t; scene.backgroundIntensity = 0.32;
  });
  const SUN_DIR = new THREE.Vector3(0.8, 0.24, -0.55).normalize();
  const sun = new THREE.DirectionalLight(0xfff2e2, 3.4);
  sun.position.copy(SUN_DIR).multiplyScalar(60);
  sun.castShadow = level >= 2;
  sun.shadow.mapSize.setScalar(level >= 3 ? 2048 : 1024);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(THREE, "#fff4e6"), color: 0xffffff,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  sunGlow.position.copy(SUN_DIR).multiplyScalar(700); sunGlow.scale.setScalar(120);
  scene.add(sunGlow);
  // Clair de Terre : un appoint froid et faible, depuis la Terre.
  const earthshine = new THREE.DirectionalLight(0x8ea4c4, 0.22);
  earthshine.position.set(...EARTH_POS).normalize().multiplyScalar(60);
  scene.add(earthshine);

  // ── Sol lunaire : le relief vient de la texture elle-même, révélé par la lumière rasante.
  const MOON_R = 170;
  // Ce qui est posé suit la courbure de la Lune : le sol descend de r² / 2R au rayon r.
  const drop = (x, z) => (x * x + z * z) / (2 * MOON_R);
  const moonMap = tex.load("assets/space/2k_moon.jpg", (t) => { t.colorSpace = THREE.SRGBColorSpace; });
  moonMap.wrapS = moonMap.wrapT = THREE.RepeatWrapping; moonMap.repeat.set(6, 3); moonMap.anisotropy = 8;
  const ground = new THREE.Mesh(new THREE.SphereGeometry(MOON_R, 180, 110),
    new THREE.MeshStandardMaterial({ map: moonMap, bumpMap: moonMap, bumpScale: 3, color: 0xa3a19c, roughness: 1, metalness: 0 }));
  // Tournée pour que la base se pose sur l'équateur de la texture (pas sur le pôle, où elle se pince).
  ground.rotation.x = Math.PI / 2;
  ground.position.y = -MOON_R + 0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  // La Terre, seule dans le ciel : un croissant éclairé par le même soleil.
  const spinners = [], planets = [];
  const earth = new THREE.Mesh(new THREE.SphereGeometry(22, 64, 48), new THREE.MeshStandardMaterial({
    map: tex.load("assets/space/2k_earth_daymap.jpg", (t) => { t.colorSpace = THREE.SRGBColorSpace; }), roughness: 0.9, metalness: 0, fog: false }));
  earth.position.set(...EARTH_POS); earth.rotation.z = 0.41;
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(22.3, 64, 48), new THREE.MeshStandardMaterial({
    map: tex.load("assets/space/2k_earth_clouds.jpg"), transparent: true, opacity: 0.6, depthWrite: false, fog: false }));
  earth.add(clouds, atmosphere(THREE, 24, 0x8fb8ff));
  scene.add(earth);
  planets.push([earth, 0.01], [clouds, 0.016]);

  // ── L'architecture : dessinée en code, une silhouette par domaine. Métal graphite, béton de
  // régolithe, verre noir ; la seule lumière verte dit « appris ».
  const M = {
    dark: new THREE.MeshStandardMaterial({ color: 0x1d1d1d, roughness: 0.48, metalness: 0.82 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x3b3b39, roughness: 0.72, metalness: 0.4 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x8e8c86, roughness: 0.95, metalness: 0 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.05, metalness: 1 }),
    dish: new THREE.MeshStandardMaterial({ color: 0xb9b7b1, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide }),
  };
  const LIT = new THREE.MeshBasicMaterial({ color: SIGNAL.clone().multiplyScalar(1.7) });
  const UNLIT = new THREE.MeshBasicMaterial({ color: 0x3d3d3b });
  const mk = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = !(mat === LIT || mat === UNLIT);
    return m;
  };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rt, rb, h, s = 24) => new THREE.CylinderGeometry(rt, rb, h, s);
  const plinth = (g, r = 2.4) => g.add(mk(cyl(r, r + 0.15, 0.36, 6), M.stone, 0, 0.18, 0));
  const ARCH = {
    tower(g, L) {          // une stèle : dalle sombre, ailettes, une fente lumineuse
      plinth(g);
      g.add(mk(box(1.6, 6.4, 1.1), M.dark, 0, 3.55, 0));
      for (const x of [-0.95, 0.95]) g.add(mk(box(0.12, 5.6, 1.5), M.panel, x, 3.15, 0));
      g.add(mk(box(0.05, 4.8, 0.02), L, 0, 3.4, 0.56), mk(box(1.62, 0.05, 1.12), L, 0, 6.2, 0));
      return 7.4;
    },
    vault(g, L) {          // une voûte de régolithe, façade de verre
      plinth(g, 2.6);
      const v = new THREE.CylinderGeometry(1.9, 1.9, 4.6, 40, 1, true, Math.PI / 2, Math.PI); v.rotateX(Math.PI / 2);
      g.add(mk(v, M.stone, 0, 0.36, 0));
      const face = new THREE.CircleGeometry(1.86, 40, 0, Math.PI);
      g.add(mk(face, M.glass, 0, 0.36, 2.28));
      const back = mk(face, M.dark, 0, 0.36, -2.28); back.rotation.y = Math.PI; g.add(back);
      for (const z of [-1.5, 0, 1.5]) g.add(mk(new THREE.TorusGeometry(1.95, 0.05, 6, 40, Math.PI), M.panel, 0, 0.36, z));
      g.add(mk(new THREE.TorusGeometry(1.88, 0.03, 6, 40, Math.PI), L, 0, 0.36, 2.3));
      return 3.4;
    },
    dish(g, L) {           // une antenne parabolique sur pylône
      plinth(g, 2);
      g.add(mk(cyl(0.22, 0.42, 2.6), M.dark, 0, 1.6, 0));
      const head = new THREE.Group(); head.position.y = 3;
      const pts = []; for (let i = 0; i <= 10; i++) { const r = (i / 10) * 2.2; pts.push(new THREE.Vector2(r, (r * r) / 6)); }
      // Inclinée de 0,85 rad : la coupe regarde le ciel et le noyau ; la source suit son axe.
      const dishM = mk(new THREE.LatheGeometry(pts, 48), M.dish); dishM.rotation.x = 0.85; head.add(dishM);
      const feed = mk(cyl(0.03, 0.03, 1.3, 8), M.dark, 0, 0.42, 0.48); feed.rotation.x = 0.85; head.add(feed);
      const tip = mk(new THREE.SphereGeometry(0.07, 12, 12), L, 0, 0.84, 0.95); head.add(tip);
      g.add(head); spinners.push([head, 0.12]);
      return 5;
    },
    mast(g, L) {           // un mât de transmission haubané
      plinth(g, 1.6);
      g.add(mk(cyl(0.07, 0.11, 8.4, 8), M.dark, 0, 4.4, 0));
      for (let y = 1.6; y < 8; y += 1.4) g.add(mk(box(1.1, 0.04, 0.04), M.panel, 0, y, 0), mk(box(0.04, 0.04, 1.1), M.panel, 0, y, 0));
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2, gx = Math.cos(a) * 1.5, gz = Math.sin(a) * 1.5;
        const p0 = new THREE.Vector3(gx, 0.36, gz), p1 = new THREE.Vector3(0, 7, 0), len = p0.distanceTo(p1);
        const wire = mk(cyl(0.012, 0.012, len, 4), M.panel); wire.position.copy(p0).lerp(p1, 0.5);
        wire.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize()); g.add(wire);
      }
      const top = new THREE.Group(); top.position.y = 8.2;
      top.add(mk(box(1.4, 0.08, 0.3), M.panel), mk(new THREE.SphereGeometry(0.1, 12, 12), L, 0, 0.35, 0));
      g.add(top); spinners.push([top, 0.3]);
      return 9.2;
    },
    dome(g, L) {           // un dôme de verre noir, côtes visibles
      plinth(g, 2.6);
      g.add(mk(new THREE.SphereGeometry(2.25, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.glass, 0, 0.36, 0));
      const ribs = new THREE.Mesh(new THREE.SphereGeometry(2.28, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x55534f, wireframe: true, transparent: true, opacity: 0.55 }));
      ribs.position.y = 0.36; g.add(ribs);
      const ring = mk(new THREE.TorusGeometry(2.3, 0.035, 6, 64), L, 0, 0.42, 0); ring.rotation.x = Math.PI / 2; g.add(ring);
      return 3.2;
    },
    stack(g, L) {          // des dalles décalées, empilées
      plinth(g, 2.5);
      for (let i = 0; i < 3; i++) {
        const s = mk(box(2.8 - i * 0.3, 0.9, 1.8), i % 2 ? M.panel : M.dark, 0, 0.84 + i * 1.02, 0); s.rotation.y = i * 0.32; g.add(s);
        const l = mk(box(2.5 - i * 0.3, 0.03, 0.03), L, 0, 1.31 + i * 1.02, 0.92); l.rotation.y = i * 0.32;
        l.position.set(Math.sin(i * 0.32) * 0.92, l.position.y, Math.cos(i * 0.32) * 0.92); g.add(l);
      }
      return 4.3;
    },
    gate(g, L) {           // une porte monolithique carrée
      plinth(g, 2.4);
      // Coins à ±1,48 une fois tourné de 45° : le cadre (épaisseur 0,34) repose sur le socle.
      const frame = mk(new THREE.TorusGeometry(2.1, 0.34, 4, 4), M.dark, 0, 2.18, 0); frame.rotation.z = Math.PI / 4; g.add(frame);
      const inner = mk(new THREE.TorusGeometry(1.66, 0.025, 4, 4), L, 0, 2.18, 0.1); inner.rotation.z = Math.PI / 4; g.add(inner);
      return 4.8;
    },
    silo(g, L) {           // une grappe de silos
      plinth(g, 2.4);
      for (const [x, z, r, h] of [[-0.9, 0.3, 0.7, 3.4], [0.8, 0.5, 0.62, 2.8], [0, -0.8, 0.55, 4.4]]) {
        g.add(mk(cyl(r, r, h, 32), M.stone, x, 0.36 + h / 2, z), mk(cyl(r * 0.9, r, 0.2, 32), M.dark, x, 0.46 + h, z));
        const band = mk(new THREE.TorusGeometry(r + 0.01, 0.025, 6, 40), L, x, 0.36 + h * 0.72, z); band.rotation.x = Math.PI / 2; g.add(band);
      }
      return 5.4;
    },
  };
  const ARCH_OF = { "Système": "tower", "Bureau": "vault", "Infos": "dish", "Communication": "mast", "Mémoire": "dome",
    "Code": "stack", "Noyau": "gate", "Autres": "silo" };

  // Repères au sol : trois cercles fins et un conduit par savoir-faire, posés sur la courbure.
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x5a5955, transparent: true, opacity: 0.5, depthWrite: false });
  for (const r of [3.7, 10, 15.6]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.035, 160), lineMat);
    ring.rotation.x = -Math.PI / 2; ring.position.y = -r * r / (2 * MOON_R) + 0.03; scene.add(ring);
  }

  // ── Le centre : un socle, quatre pylônes, et le noyau — une lumière dans une cage de verre.
  const CORE_Y = 4.4;
  const dais = new THREE.Group(); scene.add(dais);
  dais.add(mk(cyl(3.3, 3.45, 0.5, 64), M.stone, 0, 0.25, 0), mk(cyl(2.2, 2.3, 0.4, 64), M.dark, 0, 0.7, 0));
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2, x = Math.cos(a) * 2.05, z = Math.sin(a) * 2.05;
    dais.add(mk(box(0.16, 5.8, 0.16), M.dark, x, 3.6, z), mk(box(0.18, 0.04, 0.18), LIT, x, 6.52, z));
  }
  const fresnel = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: SIGNAL.clone() }, uPulse: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uPulse; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.-max(dot(vN,vV),0.), 2.6); float band = .5+.5*sin(vV.y*18.+uTime*1.2);
        vec3 c = mix(vec3(.92,.91,.88), uColor, .55+.45*uPulse);
        gl_FragColor = vec4(c*(f*1.5+.04+uPulse*.35)*mix(.85,1.,band), f*.9+.06+uPulse*.2); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 6), fresnel);
  core.position.y = CORE_Y; scene.add(core);
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32), new THREE.MeshBasicMaterial({ color: SIGNAL.clone().multiplyScalar(2.4) }));
  heart.position.y = CORE_Y; scene.add(heart);
  const gyro = [1.7, 1.95].map((r, i) => {
    const t = mk(new THREE.TorusGeometry(r, 0.022, 8, 128), M.dark, 0, CORE_Y, 0); t.rotation.x = Math.PI / 2 + (i ? 0.5 : -0.3); scene.add(t); return t;
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 60, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: SIGNAL, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  beam.position.y = CORE_Y + 31; scene.add(beam);
  const coreLight = new THREE.PointLight(0xB6E3C5, 14, 18, 1.8);
  coreLight.position.set(0, CORE_Y, 0);
  scene.add(coreLight);
  const coreLbl = document.createElement("div"); coreLbl.className = "lbl-domain core"; coreLbl.textContent = "Matthew";
  const coreObj = new CSS2DObject(coreLbl); coreObj.position.set(0, CORE_Y + 2.6, 0); scene.add(coreObj);

  // ── Un bâtiment par domaine, un module par outil, une balise par module.
  const stations = new Map(), buildings = new Map(), doms = domainsWithTools();
  const sector = (Math.PI * 2) / doms.length;
  const beaconGeo = new THREE.SphereGeometry(0.15, 16, 16), hitGeo = new THREE.SphereGeometry(0.75, 8, 8);
  const podBase = cyl(0.3, 0.38, 0.22, 16), podPost = box(0.06, 1.5, 0.06);
  const hits = [];
  const beaconColor = (t) => (t.accuracy == null ? SILVER.clone().multiplyScalar(1.1) : SILVER.clone().lerp(SIGNAL, t.accuracy).multiplyScalar(0.7 + 1.1 * t.accuracy));
  doms.forEach((dname, di) => {
    const tools = DATA.tools.filter((t) => t.domain === dname);
    const a0 = di * sector + 0.14, a1 = (di + 1) * sector - 0.14, mid = (a0 + a1) / 2;
    const bx = Math.cos(mid) * 12.6, bz = Math.sin(mid) * 12.6;
    const anyLearned = tools.some((t) => t.examples > 0);
    const g = new THREE.Group();
    const h = ARCH[ARCH_OF[dname] || "silo"](g, anyLearned ? LIT : UNLIT);
    g.position.set(bx, -drop(bx, bz), bz);
    g.rotation.y = Math.atan2(-bx, -bz);                        // la façade regarde le noyau
    scene.add(g);
    buildings.set(dname, new THREE.Vector3(bx, 1.5 - drop(bx, bz), bz));
    const dl = document.createElement("div"); dl.className = "lbl-domain pick"; dl.textContent = dom(dname);
    // Survol cinématique : un clic sur un domaine fait voler la caméra jusqu'à son bâtiment.
    dl.addEventListener("click", () => flyToDomain(dname));
    const dObj = new CSS2DObject(dl); dObj.position.set(bx, h + 0.8 - drop(bx, bz), bz); scene.add(dObj);
    tools.forEach((t, i) => {
      const a = a0 + ((i + 0.5) * (a1 - a0)) / tools.length, r = 6.4 + (i % 2) * 2.2;
      const x = Math.cos(a) * r, z = Math.sin(a) * r, y0 = -drop(x, z);
      const learned = t.examples > 0;
      const pod = new THREE.Group(); pod.position.set(x, y0, z);
      pod.add(mk(podBase, M.stone, 0, 0.11, 0), mk(podPost, learned ? M.dark : M.panel, 0, 0.97, 0));
      scene.add(pod);
      // Le conduit, du socle au module : plus clair quand le savoir-faire est appris.
      const pts = [];
      for (let k = 0; k <= 10; k++) { const rr = 3.45 + ((r - 3.45) * k) / 10; pts.push(new THREE.Vector3(Math.cos(a) * rr, -rr * rr / (2 * MOON_R) + 0.04, Math.sin(a) * rr)); }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: learned ? 0x6f6e69 : 0x2e2e2c, transparent: true, opacity: 0.8 })));
      const onCol = beaconColor(t), offCol = DIM.clone();
      const beacon = new THREE.Mesh(beaconGeo, new THREE.MeshBasicMaterial({ color: (learned ? onCol : offCol).clone() }));
      beacon.position.set(x, y0 + 1.86, z);
      scene.add(beacon);
      const el = document.createElement("div"); el.className = "lbl-tool" + (learned ? "" : " off"); el.textContent = label(t);
      const lo = new CSS2DObject(el); lo.position.set(x, y0 + 2.35, z); scene.add(lo);
      const hit = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.copy(beacon.position); hit.userData.tool = t.id; scene.add(hit); hits.push(hit);
      stations.set(t.id, { mesh: beacon, el, base: beacon.material.color.clone(), learned_on: t.learned_on, on: onCol, off: offCol });
    });
  });

  // Modèles Kenney (Space Kit, CC0) : le paysage et la vie de la base, ramenés au gris lunaire.
  const loader = new GLTFLoader(manager);
  const names = ["crater", "craterLarge", "rock_largeA", "rocks_smallA", "meteor", "rover", "craft_speederA", "astronautA"];
  const MD = {};
  await Promise.all(names.map((n) => loader.loadAsync(`assets/models/${n}.glb`).then((g) => (MD[n] = g.scene)).catch(() => null)));
  // Les modèles Kenney ont leur origine dans un coin (ce sont des tuiles) : chacun est
  // recentré sur le milieu de sa base avant d'être posé, tourné et mis à l'échelle.
  const bbox = new THREE.Box3(), midV = new THREE.Vector3();
  const GREY = new THREE.Color(0x8d8c88);
  const place = (name, x, z, s = 1, rotY = 0, y = 0, grey = 0.85) => {
    if (!MD[name]) return null;
    const inner = MD[name].clone(true);
    bbox.setFromObject(inner); bbox.getCenter(midV);
    inner.position.set(-midV.x, -bbox.min.y, -midV.z);
    inner.traverse((m) => {
      if (!m.isMesh) return;
      m.material = m.material.clone(); m.material.color.lerp(GREY, grey);
      if ("roughness" in m.material) { m.material.roughness = Math.max(m.material.roughness, 0.7); m.material.metalness = Math.min(m.material.metalness, 0.3); }
      m.castShadow = m.receiveShadow = true;
    });
    const o = new THREE.Group(); o.add(inner);
    o.scale.setScalar(s); o.position.set(x, y - drop(x, z), z); o.rotation.y = rotY;
    scene.add(o);
    return o;
  };
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // Aucun rocher sous l'objectif : ceux qui tomberaient près d'une position de caméra sont écartés.
  const cams = Object.values(SHOTS).map(([p]) => [p[0] * (small ? 1.35 : 1), p[2] * (small ? 1.35 : 1)]);
  for (let i = 0; i < 34; i++) {
    const a = rnd() * Math.PI * 2, r = 18 + rnd() * 30;
    if (cams.some(([cx, cz]) => Math.hypot(Math.cos(a) * r - cx, Math.sin(a) * r - cz) < 9)) continue;
    const kind = ["crater", "craterLarge", "rock_largeA", "rocks_smallA", "meteor"][i % 5];
    place(kind, Math.cos(a) * r, Math.sin(a) * r, 1.6 + rnd() * 2.6, rnd() * 6.28, 0, 0.95);
  }
  place("astronautA", 3.9, 2.4, 1.2, -0.7, 0.02, 0.5);
  // La vie de la base : un rover qui patrouille, un vaisseau en orbite basse.
  const rover = place("rover", 16.5, 0, 1.5, 0, 0, 0.7);
  const ship = place("craft_speederA", 0, 22, 1.6, 0, 10, 0.7);

  // Halo (bloom) au niveau 3 seulement, et seulement sur ce qui brille vraiment : le noyau,
  // les balises apprises. Chargé à la demande.
  let composerLoading = null;
  function ensureComposer() {
    if (composer || composerLoading || small || REDUCED) return;
    composerLoading = (async () => {
      try {
        const { EffectComposer } = await import("three/addons/postprocessing/EffectComposer.js");
        const { RenderPass } = await import("three/addons/postprocessing/RenderPass.js");
        const { UnrealBloomPass } = await import("three/addons/postprocessing/UnrealBloomPass.js");
        const { OutputPass } = await import("three/addons/postprocessing/OutputPass.js");
        const c = new EffectComposer(renderer);
        c.addPass(new RenderPass(scene, camera));
        c.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.6, 0.86));
        c.addPass(new OutputPass());
        c.setPixelRatio(renderer.getPixelRatio());
        c.setSize(host.clientWidth, host.clientHeight);
        composer = c;
      } catch (e) { composer = null; }
    })();
  }
  if (level >= 3) await (ensureComposer(), composerLoading);

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h); labels.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
  }
  new ResizeObserver(resize).observe(host); resize();
  function applyLevel(lv) {
    level = lv;
    renderer.setPixelRatio(Math.min(devicePixelRatio, PR[level]));
    sun.castShadow = renderer.shadowMap.enabled && level >= 2;
    resize();
    setQualityClasses(level);
    if (level >= 3) ensureComposer();
  }

  // Faisceaux : un point lumineux voyage du noyau à la balise choisie, sur un arc. Tout ce qui
  // est créé pour un faisceau est libéré quand il s'éteint (pas de fuite sur une page ouverte des heures).
  const beams = [];
  const ORIGIN = new THREE.Vector3(0, CORE_Y, 0);
  const dotGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const MISS = new THREE.Color(0x8a8a86);
  function fire(targetId, ok, expectedId) {
    const st = stations.get(targetId);
    const end = st ? st.mesh.position.clone() : new THREE.Vector3(0, CORE_Y + 6, 0);
    const curve = new THREE.QuadraticBezierCurve3(ORIGIN.clone(), ORIGIN.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 3.5, 0)), end);
    const color = ok ? SIGNAL : MISS;
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 }));
    const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(2.6) }));
    scene.add(line, dot);
    beams.push({ curve, line, dot, t: 0, st, ok, color });
    if (!ok && expectedId && stations.get(expectedId)) {             // l'outil attendu, en pointillé
      const ex = stations.get(expectedId).mesh.position;
      const dash = new THREE.Line(new THREE.BufferGeometry().setFromPoints([ORIGIN.clone(), ex.clone()]),
        new THREE.LineDashedMaterial({ color: 0xeae8e2, dashSize: 0.25, gapSize: 0.2, transparent: true, opacity: 0.45 }));
      dash.computeLineDistances(); scene.add(dash);
      setTimeout(() => { scene.remove(dash); dash.geometry.dispose(); dash.material.dispose(); }, 3200);
    }
    fresnel.uniforms.uPulse.value = Math.max(fresnel.uniforms.uPulse.value, ok ? 0.8 : 0.3);
  }
  function focus(id) {
    for (const [k, s] of stations) s.el.classList.toggle("on", k === id);
  }

  // Cliquer une balise ouvre la fiche de l'outil (un glissement de caméra n'est pas un clic).
  let pickCb = null, down = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", (e) => (down = [e.clientX, e.clientY]));
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    pickAt(e.clientX, e.clientY);
  });
  function pickAt(x, y) {
    for (const el of host.querySelectorAll(".lbl-domain.pick")) {
      const b = el.getBoundingClientRect();
      if (x >= b.left - 8 && x <= b.right + 8 && y >= b.top - 8 && y <= b.bottom + 8) { el.click(); return; }
    }
    if (!pickCb) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const got = ray.intersectObjects(hits, false)[0];
    if (got) pickCb(got.object.userData.tool);
  }
  // Tactile : un « click » n'arrive qu'après un toucher court (pas après un défilement).
  if (TOUCH) addEventListener("click", (e) => {
    if (e.target.closest("a, button, input, select, label, summary, .inner, .details, .drawer, .topbar, .index, .guide")) return;
    pickAt(e.clientX, e.clientY);
  });

  // ── La caméra ──────────────────────────────────────────────────────────────
  // « path » : elle suit le chemin des chapitres, avec un léger retard (une caméra lourde) et une
  // dérive lente quand on s'arrête de défiler. « fly » : un vol vers un bâtiment ou une balise.
  // « hold » : elle reste où le vol (ou la souris) l'a menée, jusqu'à ce qu'on défile à nouveau ;
  // « return » la ramène alors en douceur sur le chemin.
  const k = small ? 1.35 : 1;
  let pathP = [], pathT = [], curveP = null, curveT = null;
  function setStory(shots) {
    pathP = shots.map((s) => new THREE.Vector3(...(SHOTS[s] || SHOTS.far)[0]).multiplyScalar(k));
    pathT = shots.map((s) => new THREE.Vector3(...(SHOTS[s] || SHOTS.far)[1]));
    curveP = pathP.length > 1 ? new THREE.CatmullRomCurve3(pathP, false, "centripetal") : null;
    curveT = pathT.length > 1 ? new THREE.CatmullRomCurve3(pathT, false, "centripetal") : null;
  }
  setStory(["overview"]);
  function pathPose(f, outP, outT) {
    const n = pathP.length;
    if (n < 2) { outP.copy(pathP[0]); outT.copy(pathT[0]); return; }
    f = clamp(f, 0, n - 1);
    if (REDUCED) { const i = Math.round(f); outP.copy(pathP[i]); outT.copy(pathT[i]); return; }   // des coupes, pas de travelling
    const i = Math.min(Math.floor(f), n - 2);
    const t = smooth(clamp((f - i - 0.2) / 0.6, 0, 1));      // un temps de pose au début et à la fin de chaque chapitre
    const u = (i + t) / (n - 1);
    curveP.getPoint(u, outP); curveT.getPoint(u, outT);
  }
  let mode = OG ? "path" : "wait", prog = 0, smoothP = 0, yaw = 0, idleT = 0, lastScroll = 0, holdAt = 0;
  let fly = null, blend = null;
  const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  pathPose(0, tmpP, tmpT);
  camera.position.copy(tmpP).add(new THREE.Vector3(14, 26, 34)); controls.target.copy(tmpT);
  camera.lookAt(controls.target);
  if (OG) { camera.position.copy(tmpP); camera.lookAt(tmpT); }
  controls.addEventListener("start", () => { if (mode !== "fly") { mode = "hold"; holdAt = prog; fly = null; } });
  function setProgress(f) {
    if (Math.abs(f - prog) > 1e-4) lastScroll = performance.now();
    prog = f;
    if (mode === "hold" && Math.abs(f - holdAt) > 0.12) toPath(1.6);
  }
  function toPath(dur) {
    blend = { p0: camera.position.clone(), t0: controls.target.clone(), k: 0, dur };
    mode = "return";
  }
  function arrive() {                       // l'ouverture : la caméra descend sur la base
    renderer.domElement.style.opacity = "1";
    if (mode === "wait") { smoothP = prog; toPath(REDUCED ? 0.01 : 4.2); }
  }
  function flyTo(target, dist, cb) {
    const dir = camera.position.clone().sub(controls.target).setY(0).normalize();
    const p1 = target.clone().add(dir.multiplyScalar(dist)).add(new THREE.Vector3(0, dist * 0.5, 0));
    fly = { t: 0, p0: camera.position.clone(), p1, t0: controls.target.clone(), t1: target.clone(), cb };
    mode = "fly";
  }
  function flyToDomain(d) { const p = buildings.get(d); if (p) flyTo(p.clone(), 12); }
  function goShot(name) {
    const sh = SHOTS[name];
    if (!sh || OG) return;
    fly = { t: 0, p0: camera.position.clone(), p1: new THREE.Vector3(...sh[0]).multiplyScalar(k), t0: controls.target.clone(), t1: new THREE.Vector3(...sh[1]), cb: null };
    mode = "fly";
  }
  function setDay(d) {
    for (const s of stations.values()) {
      const lit = !!(s.learned_on && s.learned_on <= d);
      s.base = (lit ? s.on : s.off).clone();
      s.el.classList.toggle("off", !lit);
    }
  }
  let live = false, speaking = false;

  const clock = new THREE.Clock(), ONE = new THREE.Vector3(1, 1, 1);
  // Tactile : pendant que le doigt fait défiler, une image sur trois seulement — le défilement
  // passe avant la 3D (un GPU de téléphone saturé fait saccader la page entière).
  let scrolling = 0, frame = 0;
  if (TOUCH) addEventListener("scroll", () => (scrolling = performance.now()), { passive: true });
  // Les détails (fond plein) recouvrent la scène : inutile de la dessiner sous eux.
  const details = $("details");
  let offstage = false;
  const checkStage = () => { offstage = details.getBoundingClientRect().top < -200; };
  addEventListener("scroll", checkStage, { passive: true }); checkStage();
  // Adaptatif (qualité « auto ») : toutes les 90 images, si l'intervalle moyen dépasse le budget
  // du niveau (24 ms, soit moins de ~40 i/s ; 48 ms quand on vise 30 i/s), on descend d'un niveau.
  let last = performance.now(), sum = 0, count = 0, settleUntil = last + 4000, warned = false;
  function adapt(now) {
    const gap = now - last;
    last = now;
    if (QUALITY !== "auto" || document.hidden || gap > 250 || now < settleUntil) { sum = count = 0; return; }
    sum += gap; count++;
    if (count < 90) return;
    const avg = sum / count;
    sum = count = 0;
    if (avg > (level <= 1 ? 48 : 24) && level > 0) {
      applyLevel(level - 1);
      settleUntil = now + 2500;
      if (!warned && level <= 1 && $("guide").hidden) { warned = true; toast(T("q_toast")); }
    }
  }
  let firstFrame = true;
  (function loop(now = performance.now()) {
    requestAnimationFrame(loop);
    if (TOUCH && now - scrolling < 200 && ++frame % 3) return;
    if (offstage && !fly) { last = now; return; }
    if (level <= 1 && now - last < 31) return;   // 30 images/s
    adapt(now);
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    const U = fresnel.uniforms;
    U.uTime.value = t;
    U.uPulse.value *= 0.95;
    // Le noyau ne s'agite que pour une raison réelle : une nuit en cours (data.live) ou la visite qui parle.
    if (live) U.uPulse.value = Math.max(U.uPulse.value, 0.35 + 0.3 * Math.sin(t * 3));
    if (speaking) U.uPulse.value = Math.max(U.uPulse.value, 0.25 + 0.2 * Math.abs(Math.sin(t * 9) * Math.sin(t * 3.7)));
    coreLight.intensity = 14 + U.uPulse.value * 30;
    heart.scale.setScalar(1 + U.uPulse.value * 0.15);
    if (!REDUCED) {
      gyro[0].rotation.z += dt * 0.16; gyro[1].rotation.z -= dt * 0.11; gyro[1].rotation.y += dt * 0.05;
      core.position.y = CORE_Y + Math.sin(t * 0.9) * 0.06;
      for (const [s, sp] of spinners) s.rotation.y += dt * sp;
      for (const [m, sp] of planets) m.rotation.y += dt * sp;
      // Les modèles Kenney regardent vers −Z : sur le cercle (cos a, sin a), la marche avant
      // (−sin a, cos a) demande rotation.y = π − a.
      if (rover) { const a = t * 0.05; rover.position.set(Math.cos(a) * 16.5, -drop(16.5, 0), Math.sin(a) * 16.5); rover.rotation.y = Math.PI - a; }
      if (ship) { const a = t * 0.09; ship.position.set(Math.cos(a) * 24, 10 + Math.sin(t * 0.5) * 0.6, Math.sin(a) * 24); ship.rotation.y = Math.PI - a; }
    }
    for (const s of stations.values()) { s.mesh.material.color.lerp(s.base, 0.04); s.mesh.scale.lerp(ONE, 0.08); }
    for (let i = beams.length - 1; i >= 0; i--) {
      const b = beams[i];
      b.t += dt * (REDUCED ? 3 : 0.8);
      const kk = Math.min(b.t, 1);
      b.dot.position.copy(b.curve.getPoint(kk));
      b.line.material.opacity = Math.min(0.7, b.t * 1.2) * (b.t > 1 ? Math.max(0, 2.2 - b.t) : 1);
      if (b.t >= 1 && !b.hit) {
        b.hit = true; scene.remove(b.dot); b.dot.material.dispose();
        if (b.st) { b.st.mesh.material.color.copy(b.color).multiplyScalar(3.2); b.st.mesh.scale.setScalar(2.2); }
      }
      if (b.t > 2.2) { scene.remove(b.line); b.line.geometry.dispose(); b.line.material.dispose(); beams.splice(i, 1); }
    }

    // La caméra.
    smoothP += (prog - smoothP) * (REDUCED ? 1 : 1 - Math.exp(-dt * 2.4));
    const idle = now - lastScroll > 1500 && !REDUCED && !OG;
    idleT = idle ? idleT + dt : 0;
    yaw += ((idle ? 0.2 * Math.sin(idleT * 0.09) : 0) - yaw) * Math.min(1, dt * 0.9);
    pathPose(smoothP, tmpP, tmpT);
    if (yaw) tmpP.sub(tmpT).applyAxisAngle(UP, yaw).add(tmpT);
    if (mode === "path") {
      camera.position.copy(tmpP); controls.target.copy(tmpT); camera.lookAt(tmpT);
    } else if (mode === "return") {
      blend.k = Math.min(1, blend.k + dt / blend.dur);
      const e = easeInOut(blend.k);
      camera.position.lerpVectors(blend.p0, tmpP, e); controls.target.lerpVectors(blend.t0, tmpT, e);
      camera.lookAt(controls.target);
      if (blend.k >= 1) { mode = "path"; blend = null; }
    } else if (mode === "fly") {
      fly.t = Math.min(1, fly.t + dt / 1.8);
      const e = easeInOut(fly.t);
      camera.position.lerpVectors(fly.p0, fly.p1, e);
      controls.target.lerpVectors(fly.t0, fly.t1, e);
      camera.lookAt(controls.target);
      if (fly.t >= 1) { const cb = fly.cb; fly = null; mode = "hold"; holdAt = prog; if (cb) cb(); }
    } else if (mode === "hold") {
      controls.update();
    }
    composer && level >= 3 ? composer.render() : renderer.render(scene, camera);
    labels.render(scene, camera);
    if (firstFrame) { firstFrame = false; if (OG) renderer.domElement.style.opacity = "1"; }
  })();
  // La page attend la fin des chargements lancés (textures, ciel) avant d'ouvrir, sans dépasser le délai de main().
  await Promise.race([loaded, new Promise((r) => setTimeout(r, 6000))]);

  return {
    fire, focus, setDay, goShot, setStory, setProgress, arrive, flyToDomain,
    onPick: (cb) => (pickCb = cb),
    setLive: (on) => (live = on),
    speak: (on) => (speaking = on),
    setQuality: () => { applyLevel(guessLevel()); settleUntil = performance.now() + 3000; },
    flyToTool: (id, cb) => { const s = stations.get(id); if (s) flyTo(s.mesh.position.clone(), 8, cb); else if (cb) cb(); },
  };
}

function glowTexture(THREE, color) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, color); grd.addColorStop(0.15, color + "99"); grd.addColorStop(1, "transparent");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function atmosphere(THREE, r, color) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(max(-dot(vN,vV),0.), 1.5); gl_FragColor = vec4(uColor, f*1.1); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide, fog: false,
  }));
}

// ── Rejeu de l'examen ────────────────────────────────────────────────────────
// Les questions et les choix sont ceux du dernier examen publié : le faisceau rejoue une donnée.
function startReplay() {
  const days = examDays();
  if (!days.length || !DATA.showcase.length) { $("r-req").textContent = T("first_exam"); return; }
  const day = days[days.length - 1];
  const L = DATA.showcase.filter((x) => x.results[day] && !x.target.startsWith("__"));
  if (!L.length) { $("r-req").textContent = T("first_exam"); return; }
  const ok = L.filter((x) => x.results[day].ok).length;
  let idx = 0;
  function step() {
    const s = L[idx % L.length], r = s.results[day];
    $("r-req").textContent = `« ${s.request} »`;
    $("r-chosen").textContent = r.chosen ? toolName(r.chosen) : T("no_tool");
    const b = $("r-badge"); b.textContent = r.ok ? T("ok") : T("ko"); b.className = "badge" + (r.ok ? "" : " ko");
    $("r-seen").textContent = s.heldout ? T("never_seen") : T("seen_train");
    $("r-count").textContent = T("count", (idx % L.length) + 1, L.length, ok, fmtDate(day), r.ms ? (r.ms / 1000).toFixed(1) : "");
    if (SCENE) { SCENE.focus(r.chosen); SCENE.fire(r.chosen, r.ok, s.target); }
  }
  step();
  if (!OG) setInterval(() => { if (!document.hidden) { idx++; step(); } }, REDUCED ? 7000 : 4200);
}

// ── La visite : le noyau de Matthew présente la page lui-même ─────────────────────────
// Chaque étape fait défiler jusqu'à son chapitre (la caméra suit le chemin) et peut éclairer un
// élément. Le texte s'écrit lettre à lettre, le noyau pulse pendant qu'il « parle », la voix du
// navigateur le lit si on l'active. Vue une fois → plus jamais automatique ; « Visite » la rappelle.
let GUIDE = null;

function guideSteps() {
  const s = DATA.champion && DATA.champion.score && DATA.champion.score.composite;
  return [
    { say: G("hello"), go: "#arrival" },
    { say: G("base"), go: "#core" },
    { say: G("skills"), go: "#capabilities", target: "#dom-index" },
    Array.isArray(DATA.specialties) && DATA.specialties.length ? { say: G("spec"), go: "#c-spec", target: "#specs" } : null,
    DATA.live ? { say: G("night_live"), go: "#cycle", target: "#livebox" } : { say: G("night"), go: "#cycle", target: "#phases" },
    { say: G("exam"), go: "#exam-ch", target: ".exam-live" },
    s != null ? { say: G("score", pct(s)), go: "#exam-ch", target: "#criteria" } : null,
    { say: G("evo"), go: "#evolution", target: "#duel" },
    { say: G("bye"), go: "#transparency", end: true },
  ].filter(Boolean);
}

function guideVoice() {
  const ok = "speechSynthesis" in window;
  let on = ok && store.get("matthew-voice") === "1";
  const btn = $("g-voice");
  btn.hidden = !ok;
  const paint = () => btn.setAttribute("aria-pressed", String(on));
  paint();
  let pick = null;
  const choose = () => {
    const vs = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(LANG));
    pick = vs.find((v) => /neural|natural|online/i.test(v.name)) || vs[0] || null;
  };
  if (ok) { choose(); speechSynthesis.onvoiceschanged = choose; }
  return {
    toggle: (text) => { on = !on; store.set("matthew-voice", on ? "1" : "0"); paint(); if (on) say(text); else speechSynthesis.cancel(); },
    say,
    stop: () => ok && speechSynthesis.cancel(),
  };
  function say(text) {
    if (!on) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[«»"]/g, ""));
    u.lang = LANG === "fr" ? "fr-FR" : "en-GB"; if (pick) u.voice = pick;
    u.rate = 1; u.pitch = 1;
    speechSynthesis.speak(u);
  }
}

function startGuide() {
  if (!DATA) return;
  const box = $("guide"), text = $("g-text"), next = $("g-next"), spotEl = $("g-spot"), wave = $("g-wave");
  if (!GUIDE) GUIDE = { voice: guideVoice() };
  const steps = guideSteps();
  let i = -1, typing = null, full = "";
  box.hidden = false;
  document.body.classList.add("touring");

  function spot(sel) {
    const el = sel && document.querySelector(sel);
    if (!el || el.hidden || !el.getClientRects().length) {
      spotEl.className = "g-spot none";
      Object.assign(spotEl.style, { left: "50%", top: "50%", width: "0px", height: "0px" });
      return;
    }
    const r = el.getBoundingClientRect(), pad = 12;
    spotEl.className = "g-spot on";
    Object.assign(spotEl.style, { left: r.left - pad + "px", top: r.top - pad + "px", width: r.width + 2 * pad + "px", height: r.height + 2 * pad + "px" });
  }
  const respot = () => i >= 0 && i < steps.length && spot(steps[i].target);
  addEventListener("resize", respot);
  addEventListener("scroll", respot, { passive: true });

  const talk = (on) => { wave.classList.toggle("talking", on); if (SCENE) SCENE.speak(on); };
  function type(str) {
    clearInterval(typing);
    full = str;
    talk(true);
    if (REDUCED) { text.textContent = str; talk(false); return; }
    let n = 0;
    text.innerHTML = '<span></span><i class="caret"></i>';
    const span = text.firstChild;
    typing = setInterval(() => {
      n += str[n] === " " ? 2 : 1;
      span.textContent = str.slice(0, n);
      if (n >= str.length) finishTyping();
    }, 24);
  }
  function finishTyping() {
    clearInterval(typing); typing = null;
    text.textContent = full;
    talk(false);
  }
  // Le chapitre est amené au centre de l'écran : la caméra s'y pose d'elle-même.
  function goTo(sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    const top = sel === "#arrival" ? 0 : el.offsetTop + el.offsetHeight / 2 - innerHeight / 2;
    scrollTo({ top, behavior: REDUCED ? "auto" : "smooth" });
  }
  function go(k) {
    i = k;
    if (i >= steps.length) return close();
    const st = steps[i];
    $("g-step").textContent = `${String(i + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
    next.textContent = st.end ? T("g_end") : T("g_next");
    goTo(st.go);
    spot(st.target);
    type(st.say);
    GUIDE.voice.say(st.say);
  }
  function close() {
    clearInterval(typing);
    talk(false);
    box.hidden = true;
    document.body.classList.remove("touring");
    GUIDE.voice.stop();
    store.set("matthew-tour", "1");
    removeEventListener("resize", respot);
    removeEventListener("scroll", respot);
    removeEventListener("keydown", keys, true);
    $("tour-btn").focus({ preventScroll: true });
  }
  function advance() { if (typing) finishTyping(); else go(i + 1); }
  function keys(e) {
    if (box.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if ((e.key === "Enter" || e.key === "ArrowRight") && !e.target.closest(".g-actions button:not(#g-next)")) { e.preventDefault(); advance(); }
  }
  next.onclick = advance;
  $("g-skip").onclick = close;
  $("g-voice").onclick = () => GUIDE.voice.toggle(full);
  addEventListener("keydown", keys, true);
  go(0);
  next.focus({ preventScroll: true });
}

main();
