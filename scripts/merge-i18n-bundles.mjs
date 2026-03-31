/**
 * One-off merge of large i18n bundles. Run: node scripts/merge-i18n-bundles.mjs
 */
import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'locales');

const helpEn = {
  title: 'Help Centre',
  subtitle: 'Browse our FAQs and helpful resources to find answers to your questions.',
  faqHeading: 'FAQ',
  resourcesTitle: 'Resources',
  termsOfService: 'Terms of Service',
  videoTutorials: 'Video Tutorials',
  userManualPdf: 'User Manual (PDF)',
  comingSoon: 'Coming Soon',
  metaTitle: 'Help Centre - Marcan',
  metaDescription: 'Find answers to your questions about Marcan.',
  a1p1: 'Yes. Marcan is free to join and use for Canadian manufacturing and industrial businesses. You can create accounts, browse the ',
  a1p2: ', explore the ',
  a1p3: ', and post sourcing requests without subscriptions, commissions, or paywalls on the platform itself.',
  q2: 'Who can use Marcan (e.g. Canadian manufacturing focus)?',
  a2: 'Marcan is built for Canadian manufacturing and industry — job shops, contract manufacturers, distributors, OEMs, and related suppliers. Anyone can sign up as a buyer to search and post RFQs. Company profiles in the directory, supplier onboarding, and storefront selling are meant for organizations that operate and serve customers in Canada.',
  q3: 'What is the difference between a buyer account, a supplier account, and a storefront seller?',
  a3p1: 'A ',
  a3buyer: 'buyer account',
  a3p2: ' is for procurement teams who want to search the ecosystem, use the directory, and publish sourcing requests (RFQs). A ',
  a3supplier: 'supplier account',
  a3p3: ' is the full network path: company profile in the directory, RFQ visibility, optional AI-assisted setup from your website, and the ability to create storefront-style listings. A ',
  a3storefront: 'storefront seller',
  a3p4: ' is focused on listing surplus materials, parts, or equipment in the Shop with a lighter storefront onboarding. Paths are started from ',
  a3p5: '; buyer and supplier or storefront flows use separate onboarding steps.',
  q4: 'What is the AI search on the home page for?',
  a4: "The large prompt on the home page lets you describe what you need in plain language (for example capabilities, certifications, or industries). Submitting it takes you to Marcan's search experience so you can discover relevant companies and content from that query instead of typing exact keywords alone.",
  q5: 'What is the Company Directory and how do I use it?',
  a5p1: 'The ',
  a5p2: ' is a browsable list of supplier company profiles — capabilities, certifications, industries, locations, and public contact details when provided. Open it from the sidebar, filter or explore listings, and click through to a company\'s profile to learn more and reach out directly.',
  q6: 'How do I become a supplier and get a company profile in the directory?',
  a6p1: 'Start from ',
  a6p2: ' and choose the supplier path. Complete the onboarding form (website import or manual). Once your profile is submitted and active, your company can appear in the Company Directory and be discoverable alongside your listings and RFQ-related activity as applicable.',
  q7: 'How does the website URL / AI import work for building my supplier profile?',
  a7p1: 'You paste a public ',
  a7p2: ' URL for your company website. Marcan uses automated extraction to pull structured hints about your business — such as capabilities, location, and services — into the supplier onboarding flow. You always review and edit those fields before your profile is finalized; nothing is published without your completion of the wizard.',
  q8: "What if I don't have a website or prefer to enter my details manually?",
  a8p1: 'During supplier onboarding, choose the manual path instead of import (the link offered next to the website field). You\'ll step through the same company, capability, and contact sections yourself. You can also find it here ',
  a8p2: '.',
  q9: 'What are sourcing requests (RFQs) and how do I post one?',
  a9p1: 'Sourcing requests are buyer-side RFQs: structured posts describing parts, materials, services, quantities, or timelines you need. Create one from the ',
  a9p2: ' flow (when signed in). Suppliers and other users can discover your request and contact you using the details you choose to display. You can track what you\'ve published from ',
  a9myAccount: 'My Account',
  a9p3: ' and the My Posts areas.',
  q10: 'How do I contact a company I find on Marcan?',
  a10: "Open the company's directory or storefront profile and use the RFQ email, phone, or website they list. Shop listings and sourcing requests show the contact fields each party opted into. Marcan does not host in-app messaging for negotiations — you reach out directly by email or phone.",
  q11: 'Does Marcan handle payments, shipping, or contracts between users?',
  a11: 'No. Marcan is a discovery and connection layer: profiles, listings, and RFQs help you find each other. Pricing, invoicing, shipping, quality terms, and contracts are agreed directly between buyers and suppliers. Always perform your own diligence before placing orders or sharing sensitive information.',
  q12: 'Who do I contact if something breaks?',
  a12p1: 'Use the ',
  a12p2: ' page to send a message describing what went wrong. We use that channel for technical issues, account questions, and feedback about the platform.',
  q1: 'Is Marcan free to use?',
  linkLabelShop: 'Industrial Storefront',
};

const helpFr = {
  title: "Centre d'aide",
  subtitle: 'Parcourez la FAQ et les ressources utiles pour trouver des réponses à vos questions.',
  faqHeading: 'FAQ',
  resourcesTitle: 'Ressources',
  termsOfService: "Conditions d'utilisation",
  videoTutorials: 'Tutoriels vidéo',
  userManualPdf: "Manuel d'utilisateur (PDF)",
  comingSoon: 'Bientôt',
  metaTitle: "Centre d'aide - Marcan",
  metaDescription: 'Trouvez des réponses à vos questions sur Marcan.',
  a1p1: "Oui. Marcan est gratuit pour rejoindre et utiliser pour les entreprises manufacturières et industrielles canadiennes. Vous pouvez créer des comptes, parcourir l'",
  a1p2: ', explorer la ',
  a1p3: ', et publier des demandes d\'approvisionnement sans abonnements, commissions ou paywalls sur la plateforme elle-même.',
  q2: 'Qui peut utiliser Marcan (p. ex. focus sur la fabrication canadienne)?',
  a2: "Marcan s'adresse à la fabrication et à l'industrie canadiennes — ateliers, sous-traitants, distributeurs, OEM et fournisseurs connexes. Tout le monde peut s'inscrire comme acheteur pour chercher et publier des RFQ. Les profils dans l'annuaire, l'intégration fournisseur et la vente en vitrine visent les organisations qui opèrent et servent des clients au Canada.",
  q3: "Quelle est la différence entre un compte acheteur, un compte fournisseur et un vendeur vitrine?",
  a3p1: 'Un ',
  a3buyer: 'compte acheteur',
  a3p2: " sert aux équipes d'approvisionnement qui veulent explorer l'écosystème, utiliser l'annuaire et publier des demandes (RFQ). Un ",
  a3supplier: 'compte fournisseur',
  a3p3: " correspond au parcours réseau complet : profil dans l'annuaire, visibilité RFQ, configuration assistée par IA à partir de votre site et possibilité de publier des annonces vitrine. Un ",
  a3storefront: 'vendeur vitrine',
  a3p4: " se concentre sur l'excédent de matériaux, pièces ou équipement dans la boutique avec une intégration vitrine plus légère. Les parcours commencent depuis ",
  a3p5: " ; les flux acheteur, fournisseur ou vitrine ont des étapes d'intégration distinctes.",
  q4: "À quoi sert la recherche IA sur la page d'accueil?",
  a4: "Le grand champ sur la page d'accueil permet de décrire vos besoins en langage courant (capacités, certifications ou industries, par exemple). En l'envoyant, vous accédez à l'expérience de recherche Marcan pour découvrir des entreprises et du contenu pertinents plutôt que des mots-clés exacts seuls.",
  q5: "Qu'est-ce que l'annuaire d'entreprises et comment l'utiliser?",
  a5p1: "L'",
  a5p2: " est une liste consultable de profils fournisseurs — capacités, certifications, industries, emplacements et coordonnées publiques lorsqu'elles sont fournies. Ouvrez-le depuis la barre latérale, filtrez ou parcourez les fiches et ouvrez le profil d'une entreprise pour en savoir plus et la contacter directement.",
  q6: 'Comment devenir fournisseur et apparaître dans l’annuaire?',
  a6p1: 'Commencez depuis ',
  a6p2: " et choisissez le parcours fournisseur. Complétez le formulaire d'intégration (import de site ou manuel). Une fois le profil soumis et actif, votre entreprise peut apparaître dans l'annuaire et être découverte avec vos annonces et activité RFQ le cas échéant.",
  q7: "Comment fonctionne l'URL du site / l'import IA pour mon profil fournisseur?",
  a7p1: 'Vous collez une URL ',
  a7p2: " publique pour le site de votre entreprise. Marcan extrait automatiquement des indications structurées — capacités, lieu, services — dans le parcours fournisseur. Vous révisez toujours les champs avant publication ; rien n'est publié sans avoir terminé l'assistant.",
  q8: "Et si je n'ai pas de site ou je préfère tout saisir à la main?",
  a8p1: "Pendant l'intégration fournisseur, choisissez le parcours manuel plutôt que l'import (lien à côté du champ URL). Vous parcourrez les mêmes sections entreprise, capacités et contact. Vous pouvez aussi ouvrir ",
  a8p2: '.',
  q9: "Que sont les demandes d'approvisionnement (RFQ) et comment en publier une?",
  a9p1: "Les demandes d'approvisionnement sont des RFQ côté acheteur : des publications structurées décrivant pièces, matériaux, services, quantités ou délais. Créez-en une depuis ",
  a9p2: " (une fois connecté). Les fournisseurs peuvent découvrir votre demande et vous contacter selon les coordonnées affichées. Suivez vos publications dans ",
  a9myAccount: 'Mon compte',
  a9p3: ' et les sections Mes publications.',
  q10: 'Comment contacter une entreprise trouvée sur Marcan?',
  a10: "Ouvrez le profil annuaire ou vitrine et utilisez le courriel RFQ, le téléphone ou le site indiqués. Les annonces et RFQ montrent les coordonnées choisies. Marcan n'héberge pas de messagerie intégrée pour les négociations — vous contactez directement par courriel ou téléphone.",
  q11: 'Marcan gère-t-il les paiements, l’expédition ou les contrats entre utilisateurs?',
  a11: "Non. Marcan est une couche de mise en relation : profils, annonces et RFQ vous aident à vous trouver. Prix, facturation, expédition, qualité et contrats sont convenus directement entre acheteurs et fournisseurs. Exercez votre propre diligence avant toute commande ou partage d'informations sensibles.",
  q12: "Qui contacter en cas de problème technique?",
  a12p1: 'Utilisez la page ',
  a12p2: " pour décrire le problème. Nous utilisons ce canal pour les incidents techniques, questions de compte et commentaires sur la plateforme.",
  q1: 'Marcan est-il gratuit?',
  linkLabelShop: 'Vitrine industrielle',
};

const aboutEn = {
  heroTitle: 'About Us',
  heroSubtitle:
    'Learn about us and our mission to connect Canada’s manufacturing capabilities and simplify local sourcing.',
  originsLabel: 'Origins',
  whoWeAreTitle: 'Who We Are',
  whoWeAreBodyPrefix: "We're a team of engineering students working at the ",
  whoWeAreBodyBold: 'University of Waterloo',
  whoWeAreBodySuffix:
    '. Our goal is simple: minimize fragmentation for Canadian manufacturers.',
  credibilityLabel: 'Credibility Matters',
  supportedByTitle: 'Supported By',
  supportedBySubtitle:
    '',
  partnerUw: 'University of Waterloo',
  partnerUwSub: 'Faculty of Engineering',
  partnerNgen: 'NGen Canada',
  partnerNgenSub: 'Partner Support',
  whyTitle: 'Why Marcan Exists',
  whyBody:
    'For too long, local sourcing has been hindered by outdated directories and disconnected networks. We are removing the friction from domestic procurement so Canadian businesses can find and trade with one another more easily.',
  visionTitle: 'Our Vision',
  visionBody:
    'A future where Canadian manufacturing is easy to discover, easy to source, and easy to trust. We are building Marcan to help the right shop win the right work again and again.',
  frameworkLabel: 'Our Framework',
  whatWeDoTitle: 'What We Do',
  whatWeDoSubtitle:
    'A focused workflow for real-world manufacturing: find capacity, communicate clearly, and move decisions forward.',
  card1Title: 'Discover Local Capability',
  card1Body:
    'Browse suppliers and manufacturing capabilities using our AI search tool built exclusively for Canadian businesses.',
  card2Title: 'List What You Can Build',
  card2Body: 'Publish equipment, materials, surplus parts, and capacity so buyers can find you faster.',
  card3Title: 'Match Through RFQs',
  card3Body: 'Send targeted sourcing requests and connect directly, so conversations start on the right spec.',
  ctaTitle: 'Ready to Build the Network?',
  ctaBody:
    'Join Marcan to connect directly with local manufacturers and to build a more resilient Canadian manufacturing industry.',
  ctaSignUp: 'Create Account',
  ctaContact: 'Talk To Us',
  metaTitle: 'About Us - Marcan',
  metaDescription:
    'Learn about Marcan, a premium B2B network built to revitalize Canadian manufacturing through fast, local connections.',
};

const aboutFr = {
  heroTitle: 'À propos de nous',
  heroSubtitle:
    'Découvrez notre mission : relier les capacités manufacturières du Canada et simplifier l’approvisionnement local.',
  originsLabel: 'Origines',
  whoWeAreTitle: 'Qui nous sommes',
  whoWeAreBodyPrefix: 'Nous sommes une équipe d’étudiants en génie et de bâtisseurs du secteur à l’',
  whoWeAreBodyBold: 'Université de Waterloo',
  whoWeAreBodySuffix:
    '. Notre objectif est simple : réduire la fragmentation et rendre l’approvisionnement local évident pour les fabricants canadiens.',
  credibilityLabel: 'La crédibilité compte',
  supportedByTitle: 'Soutenu par',
  supportedBySubtitle:
    'Marcan est soutenu par des institutions de premier plan qui renforcent les talents et les capacités manufacturières.',
  partnerUw: 'Université de Waterloo',
  partnerUwSub: 'Faculté de génie',
  partnerNgen: 'NGen Canada',
  partnerNgenSub: 'Soutien partenaire',
  whyTitle: 'Pourquoi Marcan existe',
  whyBody:
    "Depuis trop longtemps, l'approvisionnement local souffre d'annuaires dépassés et de réseaux fragmentés. Nous réduisons les frictions pour que les entreprises canadiennes se trouvent et échangent plus facilement.",
  visionTitle: 'Notre vision',
  visionBody:
    'Un avenir où la fabrication canadienne est facile à découvrir, à sourcer et à laquelle faire confiance. Nous bâtissons Marcan pour que le bon atelier gagne le bon contrat, encore et encore.',
  frameworkLabel: 'Notre cadre',
  whatWeDoTitle: 'Ce que nous faisons',
  whatWeDoSubtitle:
    'Un flux concret pour la fabrication : trouver de la capacité, communiquer clairement et faire avancer les décisions.',
  card1Title: 'Découvrir la capacité locale',
  card1Body:
    'Parcourez les fournisseurs et capacités avec notre recherche IA conçue pour les entreprises canadiennes.',
  card2Title: 'Lister ce que vous fabriquez',
  card2Body:
    'Publiez équipement, matériaux, pièces excédentaires et capacité pour que les acheteurs vous trouvent plus vite.',
  card3Title: 'Matcher par RFQ',
  card3Body:
    'Envoyez des demandes ciblées et connectez-vous directement pour démarrer sur les bonnes spécifications.',
  ctaTitle: 'Prêt à bâtir le réseau?',
  ctaBody:
    'Rejoignez Marcan pour vous connecter aux fabricants locaux et renforcer l’industrie manufacturière canadienne.',
  ctaSignUp: 'Créer un compte',
  ctaContact: 'Nous joindre',
  metaTitle: 'À propos - Marcan',
  metaDescription:
    'Découvrez Marcan, un réseau B2B pour revitaliser la fabrication canadienne par des connexions rapides et locales.',
};

const loginEn = {
  title: 'Welcome Back',
  subtitle: 'Sign in to access your procurement dashboard and sourcing tools.',
  emailLabel: 'Email Address',
  passwordLabel: 'Password',
  rememberMe: 'Remember me',
  forgotPassword: 'Forgot Password?',
  signIn: 'Sign In',
  signingIn: 'Signing in...',
  noAccount: "Don't have an account?",
  signUpLink: 'Sign up',
  resetTitle: 'Reset Password',
  resetBody: "Enter your email address and we'll send you a link to reset your password.",
  sendResetLink: 'Send Reset Link',
  sending: 'Sending...',
  errGeneric: 'An error occurred during login.',
  errInvalidCredential: 'Invalid email or password. Please check your credentials and try again.',
  errUserNotFound: 'No account found with this email address.',
  errWrongPassword: 'Incorrect password. Please try again.',
  errInvalidEmail: 'Invalid email address.',
  errUserDisabled: 'This account has been disabled.',
  errTooManyRequests: 'Too many failed login attempts. Please try again later.',
  errNetwork: 'Network error. Please check your internet connection.',
  errResetFailed: 'Failed to send password reset email.',
  resetSent: 'Password reset email sent! Please check your inbox.',
  breadcrumb: 'Login',
};

const loginFr = {
  title: 'Bon retour',
  subtitle: 'Connectez-vous pour accéder à votre tableau de bord et à vos outils d’approvisionnement.',
  emailLabel: 'Adresse courriel',
  passwordLabel: 'Mot de passe',
  rememberMe: 'Se souvenir de moi',
  forgotPassword: 'Mot de passe oublié?',
  signIn: 'Se connecter',
  signingIn: 'Connexion…',
  noAccount: 'Pas encore de compte?',
  signUpLink: 'S’inscrire',
  resetTitle: 'Réinitialiser le mot de passe',
  resetBody: 'Saisissez votre courriel et nous vous enverrons un lien de réinitialisation.',
  sendResetLink: 'Envoyer le lien',
  sending: 'Envoi…',
  errGeneric: 'Une erreur s’est produite lors de la connexion.',
  errInvalidCredential: 'Courriel ou mot de passe invalide. Vérifiez vos identifiants.',
  errUserNotFound: 'Aucun compte associé à cette adresse courriel.',
  errWrongPassword: 'Mot de passe incorrect. Réessayez.',
  errInvalidEmail: 'Adresse courriel invalide.',
  errUserDisabled: 'Ce compte a été désactivé.',
  errTooManyRequests: 'Trop de tentatives échouées. Réessayez plus tard.',
  errNetwork: 'Erreur réseau. Vérifiez votre connexion.',
  errResetFailed: 'Échec de l’envoi du courriel de réinitialisation.',
  resetSent: 'Courriel de réinitialisation envoyé! Vérifiez votre boîte de réception.',
  breadcrumb: 'Connexion',
};

function merge(file, bundles) {
  const p = path.join(root, file);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const [k, v] of Object.entries(bundles)) {
    j[k] = v;
  }
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
}

merge('en.json', { help: helpEn, about: aboutEn, login: loginEn });
merge('fr.json', { help: helpFr, about: aboutFr, login: loginFr });

console.log('Merged help, about, login into en.json and fr.json');
