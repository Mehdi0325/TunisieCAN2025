// ========== AUTHENTICATION SYSTEM ==========
let users = JSON.parse(localStorage.getItem('quizUsers')) || [];
let currentUser = null;
let pendingEmailVerification = null;
let verificationCode = null;
let pendingPasswordReset = null;
let passwordResetCode = null;

// ========== EMAILJS CONFIGURATION ==========
const EMAILJS_USER_ID = "oSgl6JSLvtdRK4_wo";
const EMAILJS_SERVICE_ID = "service_mpcwcys";
const EMAILJS_TEMPLATE_ID = "template_v3azkzq";
const EMAILJS_FROM_EMAIL = "TunisieCAN2025@gmail.com"; // Email expéditeur

// ========== QUIZ SYSTEM ==========
let quizIndex = 0;
let quizScore = 0;
let quizPlayersGlobal = [];
let currentQuizMode = 'all';
let currentQuizCategory = null;
let quizStartTime = null;
let quizEndTime = null;

// Initialiser EmailJS (pas nécessaire avec l'API REST)
function initEmailJS() {
    console.log("✅ EmailJS API REST prête!");
}

// Fonction pour envoyer le code par email via API REST
function sendVerificationCode(email, code) {
    console.log(`📧 CODE ENVOYÉ À: ${email}`);
    console.log(`🔐 CODE: ${code}`);
    
    // Envoyer via EmailJS API REST
    const data = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_USER_ID,
        template_params: {
            to_email: email,
            from_email: EMAILJS_FROM_EMAIL,
            verification_code: code
        }
    };

    fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            console.log("✅ Email envoyé avec succès!");
        } else {
            console.error("❌ Erreur lors de l'envoi:", response.statusText);
            alert("Erreur lors de l'envoi de l'email. Réessayez.");
        }
    })
    .catch(error => {
        console.error("❌ Erreur réseau:", error);
        alert("Erreur lors de l'envoi de l'email. Réessayez.");
    });
}

// Toggle visibilité mot de passe
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
}

// Valider la longueur du pseudo en temps réel
function validatePseudoLength(fieldId) {
    const field = document.getElementById(fieldId);
    if (field.value.length > 10) {
        field.classList.add('input-error');
    } else {
        field.classList.remove('input-error');
    }
}

// Charger les données de connexion au démarrage
function loadUserData() {
    const savedEmail = localStorage.getItem('currentUserEmail');
    const savedPseudo = localStorage.getItem('currentUserPseudo');
    
    if (savedEmail && savedPseudo) {
        currentUser = {
            email: savedEmail,
            pseudo: savedPseudo
        };
        console.log('User restauré au démarrage:', currentUser.email);
        // Charger les scores du user restauré
        loadScoresFromStorage();
    }
    
    // Cacher le tableau des scores sur la page de login
    const scoresBoard = document.getElementById('scores-board');
    if (scoresBoard && !currentUser) {
        scoresBoard.classList.add('hidden');
    }
}

function toggleLoginForm() {
    document.getElementById('signup-form').classList.toggle('hidden');
    document.getElementById('login-form').classList.toggle('hidden');
}

function register() {
    const email = document.getElementById('signup-email').value.trim();
    const pseudo = document.getElementById('signup-pseudo').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    
    if (!email || !pseudo || !password) {
        document.getElementById('error-empty-fields-signup').classList.remove('hidden');
        return;
    }
    
    if (email.length < 5 || !email.includes('@')) {
        alert('❌ Email invalide');
        return;
    }
    
    // Validation du pseudo (max 10 caractères)
    if (pseudo.length > 10) {
        alert('❌ Le pseudo ne doit pas dépasser 10 caractères');
        return;
    }
    
    // Validation du mot de passe
    // - Plus de 7 caractères (minimum 8)
    // - Au moins 1 caractère spécial (!,?,@,#,&,*)
    // - Au moins 1 chiffre (1-9)
    
    if (password.length < 8) {
        alert('❌ Le mot de passe doit contenir au moins 8 caractères');
        return;
    }
    
    // Vérifier les caractères spéciaux
    const specialCharsRegex = /[!?@#&*]/;
    if (!specialCharsRegex.test(password)) {
        alert('❌ Le mot de passe doit contenir au moins 1 caractère spécial: ! ? @ # & *');
        return;
    }
    
    // Vérifier les chiffres (1-9)
    const digitRegex = /[1-9]/;
    if (!digitRegex.test(password)) {
        alert('❌ Le mot de passe doit contenir au moins 1 chiffre (1-9)');
        return;
    }
    
    // Vérifier si l'email existe déjà
    if (users.some(u => u.email === email)) {
        // Afficher la case email déjà existant
        document.getElementById('signup-form').classList.add('hidden');
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('email-exists-message').classList.remove('hidden');
        return;
    }
    
    // Vérifier si le pseudo existe déjà
    if (users.some(u => u.pseudo === pseudo)) {
        // Afficher la modale pseudo déjà utilisé
        document.getElementById('signup-form').classList.add('hidden');
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('pseudo-exists-message').classList.remove('hidden');
        return;
    }
    
    // Générer un code de vérification
    verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Sauvegarder les données en attente
    pendingEmailVerification = {
        email: email,
        pseudo: pseudo,
        password: password
    };
    
    // Envoyer le code par email (console only pour maintenant)
    sendVerificationCode(email, verificationCode);
    
    // Afficher l'écran de vérification SANS montrer le code
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('email-verification-pending').classList.remove('hidden');
    document.getElementById('pending-verification-email').textContent = email;
}

function verifyEmail() {
    const enteredCode = document.getElementById('verification-code').value.trim();
    
    if (enteredCode !== verificationCode) {
        // Afficher la modale code incorrect
        document.getElementById('wrong-email-code-message').classList.remove('hidden');
        return;
    }
    
    // Code correct: créer le compte
    users.push({
        email: pendingEmailVerification.email,
        pseudo: pendingEmailVerification.pseudo,
        password: pendingEmailVerification.password,
        verified: true
    });
        localStorage.setItem('quizUsers', JSON.stringify(users));
    
    // Masquer le formulaire de vérification
    document.getElementById('email-verification-pending').classList.add('hidden');
    
    // Afficher la case de succès
    document.getElementById('signup-success-message').classList.remove('hidden');
    
    // Réinitialiser les variables
    pendingEmailVerification = null;
    verificationCode = null;
    document.getElementById('verification-code').value = '';
}

function cancelVerification() {
    pendingEmailVerification = null;
    verificationCode = null;
    document.getElementById('verification-code').value = '';
    document.getElementById('email-verification-pending').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
}

function login() {
    const emailOrPseudo = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    if (!emailOrPseudo || !password) {
        document.getElementById('error-empty-fields-login').classList.remove('hidden');
        return;
    }
    
    // Chercher l'utilisateur par email ou pseudo
    const user = users.find(u => 
        (u.email === emailOrPseudo || u.pseudo === emailOrPseudo) && u.password === password
    );
    
    if (!user) {
        // Compte non trouvé - afficher la case du thème
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('no-account-message').classList.remove('hidden');
        return;
    }
    
    // Connexion réussie
    currentUser = {
        email: user.email,
        pseudo: user.pseudo
    };
    
    console.log('User connecté:', currentUser.email);
    
    localStorage.setItem('currentUserEmail', user.email);
    localStorage.setItem('currentUserPseudo', user.pseudo);
    
    // Charger les scores du user connecté
    loadScoresFromStorage();
    updateScoresDisplay(); // Mettre à jour l'affichage des scores du nouveau user
    
    // Afficher la case de confirmation
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('login-success-message').classList.remove('hidden');
    document.getElementById('success-pseudo').textContent = user.pseudo;
    
    // Redirection automatique après 2 secondes
    setTimeout(() => {
        console.log('Redirection vers main-menu');
        
        // Masquer tous les écrans
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.add('hidden');
            s.style.display = 'none';
        });
        
        // Afficher main-menu avec styles forcés
        const mainMenu = document.getElementById('main-menu');
        mainMenu.classList.remove('hidden');
        mainMenu.style.display = 'flex';
        mainMenu.style.width = '100%';
        mainMenu.style.alignItems = 'center';
        mainMenu.style.justifyContent = 'center';
        mainMenu.style.flexDirection = 'column';
        
        console.log('main-menu affiché avec styles forcés');
        
        displayUserProfile();
        // Afficher le profil (le tableau des scores ne doit apparaître qu'en Quiz)
        document.getElementById('user-profile-card').classList.remove('hidden');
        document.getElementById('scores-board').classList.add('hidden');
    }, 2000);
}

function showPasswordReset() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('password-reset-form').classList.remove('hidden');
}

function sendPasswordReset() {
    const email = document.getElementById('reset-email').value.trim();
    
    if (!email) {
        document.getElementById('error-empty-email-reset').classList.remove('hidden');
        return;
    }
    
    // Vérifier si l'email existe
    const user = users.find(u => u.email === email);
    if (!user) {
        alert('Aucun compte associé à cet email');
        return;
    }
    
    // Générer un code de réinitialisation
    passwordResetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    pendingPasswordReset = {
        email: email,
        pseudo: user.pseudo
    };
    
    // Envoyer le code par email
    sendVerificationCode(email, passwordResetCode);
    
    // Afficher l'écran d'attente SANS montrer le code
    document.getElementById('password-reset-form').classList.add('hidden');
    document.getElementById('password-reset-pending').classList.remove('hidden');
    document.getElementById('pending-reset-email').textContent = email;
}

function verifyPasswordReset() {
    const enteredCode = document.getElementById('reset-verification-code').value.trim();
    
    if (enteredCode !== passwordResetCode) {
        // Afficher la modale code incorrect
        document.getElementById('wrong-reset-code-message').classList.remove('hidden');
        return;
    }
    
    // Code correct: afficher formulaire de changement de mot de passe
    document.getElementById('password-reset-pending').classList.add('hidden');
    document.getElementById('password-change-form').classList.remove('hidden');
}

// Fermer modale code incorrect pour email
function closeWrongEmailCode() {
    document.getElementById('wrong-email-code-message').classList.add('hidden');
    document.getElementById('email-verification-pending').classList.remove('hidden');
    document.getElementById('verification-code').value = '';
}

// Fermer modale code incorrect pour mot de passe
function closeWrongResetCode() {
    document.getElementById('wrong-reset-code-message').classList.add('hidden');
    document.getElementById('password-reset-pending').classList.remove('hidden');
    document.getElementById('reset-verification-code').value = '';
}

function updatePassword() {
    const newPassword = document.getElementById('new-password').value.trim();
    
    // Validation du mot de passe (même que pour l'inscription)
    if (!newPassword) {
        alert('❌ Entrez un nouveau mot de passe');
        return;
    }
    
    if (newPassword.length < 8) {
        alert('❌ Le mot de passe doit contenir au moins 8 caractères');
        return;
    }
    
    // Vérifier les caractères spéciaux
    const specialCharsRegex = /[!?@#&*]/;
    if (!specialCharsRegex.test(newPassword)) {
        alert('❌ Le mot de passe doit contenir au moins 1 caractère spécial: ! ? @ # & *');
        return;
    }
    
    // Vérifier les chiffres (1-9)
    const digitRegex = /[1-9]/;
    if (!digitRegex.test(newPassword)) {
        alert('❌ Le mot de passe doit contenir au least 1 chiffre (1-9)');
        return;
    }
    
    // Trouver l'utilisateur et mettre à jour le mot de passe
    const user = users.find(u => u.email === pendingPasswordReset.email);
    if (user) {
        user.password = newPassword;
        localStorage.setItem('quizUsers', JSON.stringify(users));
        
        // Afficher la modale de succès
        document.getElementById('password-change-form').classList.add('hidden');
        document.getElementById('password-reset-success').classList.remove('hidden');
        
        // Réinitialiser les variables
        pendingPasswordReset = null;
        passwordResetCode = null;
        document.getElementById('new-password').value = '';
    }
}

function cancelPasswordReset() {
    pendingPasswordReset = null;
    passwordResetCode = null;
    document.getElementById('reset-email').value = '';
    document.getElementById('password-reset-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

function cancelPasswordChange() {
    pendingPasswordReset = null;
    passwordResetCode = null;
    document.getElementById('new-password').value = '';
    document.getElementById('password-change-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

function goToLogin() {
    document.getElementById('email-exists-message').classList.add('hidden');
    document.getElementById('password-reset-success').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('login-email').focus();
}

function goToSignup() {
    document.getElementById('no-account-message').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('signup-email').focus();
}

function goBackToSignup() {
    document.getElementById('pseudo-exists-message').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('signup-pseudo').focus();
}

function backToLogin() {
    document.getElementById('no-account-message').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('login-email').focus();
}

function closeErrorSignup() {
    document.getElementById('error-empty-fields-signup').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
}

function closeErrorLogin() {
    document.getElementById('error-empty-fields-login').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

function closeErrorReset() {
    if (document.getElementById('error-empty-email-reset')) {
        document.getElementById('error-empty-email-reset').classList.add('hidden');
    }
    document.getElementById('password-reset-form').classList.remove('hidden');
}

function updateUserButtonDisplay() {
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        if (currentUser) {
            googleBtn.innerHTML = '<div style="display:flex; align-items:center; gap:10px; background:white; padding:10px 15px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1); font-family:Arial;"><span>👤 ' + currentUser.pseudo + '</span><button onclick="logoutUser()" style="background:#E70013; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">Déco</button></div>';
        } else {
            googleBtn.innerHTML = '<button onclick="showLoginScreen()" class="google-sign-btn">🔐 Se connecter</button>';
        }
    }
}

function logoutUser() {
    console.log('logoutUser() called');
    
    currentUser = null;
    scoreHistory = {}; // Réinitialiser les scores du compte précédent
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUserPseudo');
    
    // Masquer le tableau des scores
    const scoresBoard = document.getElementById('scores-board');
    if (scoresBoard) {
        scoresBoard.classList.add('hidden');
    }
    
    // Masquer le profil
    document.getElementById('user-profile-card').classList.add('hidden');
    
    // Masquer TOUTES les modales et formulaires
    document.querySelectorAll('.login-form').forEach(form => {
        form.classList.add('hidden');
    });
    
    // Masquer la modale et l'overlay de déconnexion
    const logoutConfirm = document.getElementById('logout-confirm-message');
    if (logoutConfirm) logoutConfirm.classList.add('hidden');
    
    const logoutOverlay = document.getElementById('logout-overlay');
    if (logoutOverlay) logoutOverlay.classList.add('hidden');
    
    // Masquer tous les écrans
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });
    
    // Afficher l'écran de connexion avec styles forcés
    const loginScreen = document.getElementById('login-screen');
    loginScreen.classList.remove('hidden');
    loginScreen.style.display = 'flex';
    loginScreen.style.width = '100%';
    loginScreen.style.alignItems = 'center';
    loginScreen.style.justifyContent = 'center';
    loginScreen.style.flexDirection = 'column';
    
    // Afficher le formulaire de connexion par défaut
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.classList.remove('hidden');
    }
    
    // Masquer le formulaire d'inscription
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.classList.add('hidden');
    }
    
    console.log('login-screen affiché avec styles forcés');
}

// Mettre à jour l'affichage du profil utilisateur
function displayUserProfile() {
    if (currentUser) {
        document.getElementById('user-profile-name').textContent = currentUser.pseudo;
        document.getElementById('user-profile-card').classList.remove('hidden');
    } else {
        document.getElementById('user-profile-card').classList.add('hidden');
    }
}

function updateUserButtonDisplay() {
    displayUserProfile();
}

function showLoginScreen() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('login-screen').classList.remove('hidden');
    
    // Cacher le tableau des scores
    const scoresBoard = document.getElementById('scores-board');
    if (scoresBoard) {
        scoresBoard.classList.add('hidden');
    }
}

// Variables pour le système de quiz
// (déjà déclarées au top du fichier)

// La liste reste la même, mais on va la mélanger
let joueurs = [
    { nom: "Aymen Dahmen", poste: "Gardien", fichier: "Aymen-Dahmen.png", age: 28, taille: "188cm", pied: "Droitier", club: "CS Sfaxien", logoClub: "CS-Sfaxien.png" },
    { nom: "Bechir Ben Said", poste: "Gardien", fichier: "Bechir-Ben-Said.png", age: 33, taille: "193cm", pied: "Droitier", club: "ES Tunis", logoClub: "ES-Tunis.png" },
    { nom: "Noureddine Farhati", poste: "Gardien", fichier: "Noureddine-Farhati.png", age: 25, taille: "188cm", pied: "Droitier", club: "Stade Tunisien", logoClub: "Stade-Tunisien.png" },
    { nom: "Sabri Ben Hassen", poste: "Gardien", fichier: "Sabri-Ben-Hassen.png", age: 29, taille: "189cm", pied: "Droitier", club: "ES Sahel", logoClub: "ES-Sahel.png" },
    { nom: "Yassine Meriah", poste: "Défenseur", fichier: "Yassine-Meriah.png", age: 32, taille: "188cm", pied: "Droitier", club: "ES Tunis", logoClub: "ES-Tunis.png" },
    { nom: "Montassar Talbi", poste: "Défenseur", fichier: "Montassar-Talbi.png", age: 27, taille: "190cm", pied: "Droitier", club: "FC Lorient", logoClub: "FC-Lorient.png" },
    { nom: "Dylan Bronn", poste: "Défenseur", fichier: "Dylan-Bronn.png", age: 30, taille: "185cm", pied: "Droitier", club: "Servette", logoClub: "Servette.png" },
    { nom: "Adem Arouss", poste: "Défenseur", fichier: "Adem-Arouss.png", age: 21, taille: "188cm", pied: "Droitier", club: "Kasimpasa", logoClub: "Kasimpasa.png" },
    { nom: "Nader Ghandri", poste: "Défenseur", fichier: "Nader-Ghandri.png", age: 30, taille: "197cm", pied: "Droitier", club: "Akhmat Grozny", logoClub: "Akhmat-Grozny.png" },
    { nom: "Mohamed Ben Ali", poste: "Défenseur", fichier: "Mohamed-Ben-Ali.png", age: 30, taille: "175cm", pied: "Droitier", club: "ES Tunis", logoClub: "ES-Tunis.png" },
    { nom: "Yan Valery", poste: "Défenseur", fichier: "Yan-Valery.png", age: 26, taille: "185cm", pied: "Droitier", club: "Sheffield Wednesday", logoClub: "Sheffield-Wednesday.png" },
    { nom: "Ali Abdi", poste: "Défenseur", fichier: "Ali-Abdi.png", age: 32, taille: "183cm", pied: "Droitier", club: "OGC Nice", logoClub: "OGC-Nice.png" },
    { nom: "Ben Ouanes", poste: "Défenseur", fichier: "Ben-Ouanes.png", age: 31, taille: "182cm", pied: "Droitier", club: "Kasimpasa", logoClub: "Kasimpasa.png" },
    { nom: "Ali Maaloul", poste: "Défenseur", fichier: "Ali-Maaloul.png", age: 35, taille: "175cm", pied: "Droitier", club: "CS Sfaxien", logoClub: "CS-Sfaxien.png" },
    { nom: "Ellyes Skhiri", poste: "Milieu", fichier: "Ellyes-Skhiri.png", age: 30, taille: "185cm", pied: "Droitier", club: "Eintracht Frankfurt", logoClub: "Eintracht-Frankfurt.png" },
    { nom: "Houssem Tka", poste: "Milieu", fichier: "Houssem-Tka.png", age: 25, taille: "175cm", pied: "Droitier", club: "ES Tunis", logoClub: "ES-Tunis.png" },
    { nom: "Ferjani Sassi", poste: "Milieu", fichier: "Ferjani-Sassi.png", age: 29, taille: "189cm", pied: "Droitier", club: "CS Sfaxien", logoClub: "CS-Sfaxien.png" },
    { nom: "Ismael Gharbi", poste: "Milieu", fichier: "Ismael-Gharbi.png", age: 21, taille: "173cm", pied: "Droitier", club: "Augsburg", logoClub: "FC-Augsburg.png" },
    { nom: "Haj Mahmoud", poste: "Milieu", fichier: "Haj-Mahmoud.png", age: 25, taille: "179cm", pied: "Droitier", club: "FC Lugano", logoClub: "FC-Lugano.png" },
    { nom: "Ben Romdhane", poste: "Milieu", fichier: "Ben-Romdhane.png", age: 26, taille: "180cm", pied: "Droitier", club: "Al Ahly", logoClub: "Al-Ahly.png" },
    { nom: "Hannibal Mejbri", poste: "Milieu", fichier: "Hannibal-Mejbri.png", age: 22, taille: "177cm", pied: "Droitier", club: "Burnley", logoClub: "Burnley.png" },
    { nom: "Elias Saad", poste: "Attaquant", fichier: "Elias-Saad.png", age: 25, taille: "185cm", pied: "Droitier", club: "Augsburg", logoClub: "FC-Augsburg.png" },
    { nom: "Elias Achouri", poste: "Attaquant", fichier: "Elias-Achouri.png", age: 26, taille: "177cm", pied: "Droitier", club: "FC Copenhagen", logoClub: "FC-Copenhagen.png" },
    { nom: "Sebastian Tounekti", poste: "Attaquant", fichier: "Sebastian-Tounekti.png", age: 23, taille: "170cm", pied: "Gaucher", club: "Celtic FC", logoClub: "Celtic-FC.png" },
    { nom: "Firas Chaouat", poste: "Attaquant", fichier: "Firas-Chaouat.png", age: 29, taille: "185cm", pied: "Droitier", club: "Club Africain", logoClub: "Club-Africain.png" },
    { nom: "Hazem Mastouri", poste: "Attaquant", fichier: "Hazem-Mastouri.png", age: 28, taille: "191cm", pied: "Droitier", club: "FC Dynamo-Makhachkala", logoClub: "FC-Dynamo-Makhachkala.png" },
    { nom: "Jaziri", poste: "Attaquant", fichier: "Jaziri.png", age: 32, taille: "180cm", pied: "Droitier", club: "Zamalek", logoClub: "Zamalek.png" },
    { nom: "Naim Sliti", poste: "Attaquant", fichier: "Naim-Sliti.png", age: 33, taille: "173cm", pied: "Droitier", club: "Al Shamal", logoClub: "Al-Shamal.png" }
];

// Système de stockage des scores
let scoreHistory = {};

// Charger les scores du localStorage au démarrage
function loadScoresFromStorage() {
    console.log('loadScoresFromStorage() called for user:', currentUser?.email);
    
    if (!currentUser || !currentUser.email) {
        console.log('No currentUser, cannot load scores');
        scoreHistory = {};
        return;
    }
    
    // Utiliser une clé unique par compte
    const key = 'quizScores_' + currentUser.email;
    const stored = localStorage.getItem(key);
    
    if (stored) {
        scoreHistory = JSON.parse(stored);
        console.log('Scores chargés pour', currentUser.email, ':', scoreHistory);
    } else {
        scoreHistory = {};
        console.log('Aucun score trouvé pour', currentUser.email);
    }
}

// Sauvegarder les scores dans localStorage
function saveScoresToStorage() {
    if (!currentUser || !currentUser.email) {
        console.log('No currentUser, cannot save scores');
        return;
    }
    
    // Utiliser une clé unique par compte
    const key = 'quizScores_' + currentUser.email;
    localStorage.setItem(key, JSON.stringify(scoreHistory));
    console.log('Scores sauvegardés pour', currentUser.email);
}

// Ajouter un score à l'historique
function addScoreToHistory(quizType, categoryName, score, maxScore) {
    // Créer une clé standardisée
    const categoryKey = categoryName.replace(/\s+/g, '');
    const key = quizType + categoryKey;
    
    const scoreData = {
        score: score,
        maxScore: maxScore,
        quizType: quizType,
        category: categoryName,
        date: new Date().toLocaleDateString('fr-FR')
    };
    
    if (!scoreHistory[key]) {
        scoreHistory[key] = [];
    }
    
    scoreHistory[key].push(scoreData);
    
    // Garder seulement les 5 derniers scores
    if (scoreHistory[key].length > 5) {
        scoreHistory[key].shift();
    }
    
    saveScoresToStorage();
    
    // Sauvegarder dans Firebase si connecté (vérifier que la variable existe)
    if (typeof currentFirebaseUser !== 'undefined' && currentFirebaseUser) {
        saveScoreToFirebase(scoreData);
    }
    
    updateScoresDisplay();
}

// Mettre à jour l'affichage des scores
function updateScoresDisplay() {
    const scoresBoard = document.getElementById('scores-board');
    if (!scoresBoard) return;
    
    let html = '<div class="scores-title">Score</div>';
    let hasScores = false;
    let totalPoints = 0;
    
    // Afficher les derniers scores
    for (let key in scoreHistory) {
        if (scoreHistory[key] && scoreHistory[key].length > 0) {
            hasScores = true;
            const lastScore = scoreHistory[key][scoreHistory[key].length - 1];
            const categoryDisplay = lastScore.category || 'Tous';
            totalPoints += lastScore.score;
            
            html += `<div class="score-item">
                <span class="score-label">${categoryDisplay}</span>
                <span class="score-value">${lastScore.score}/${lastScore.maxScore}</span>
            </div>`;
        }
    }
    
    if (hasScores) {
        html += '<div class="score-separator"></div>';
        html += `<div class="score-total">
            <span class="score-label">TOTAL</span>
            <span class="score-value">${totalPoints}</span>
        </div>`;
    } else {
        html += '<div style="padding: 15px; text-align: center; font-size: 16px; font-weight: bold; color: white; cursor: pointer;" onclick="showQuizMenu()">Teste toi !</div>';
    }
    
    html += '<button class="reset-btn-inside" onclick="resetAllScores()">RESET</button>';
    
    scoresBoard.innerHTML = html;
}

// Réinitialiser tous les scores
function resetAllScores() {
    // Ajouter un overlay
    let overlay = document.getElementById('reset-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'reset-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); z-index: 999;';
        document.body.appendChild(overlay);
    } else {
        overlay.style.display = 'block';
    }
    
    // Afficher la modale de confirmation
    document.getElementById('reset-confirm-modal').classList.remove('hidden');
}

function confirmResetScores() {
    scoreHistory = {};
    localStorage.removeItem('quizScores');
    updateScoresDisplay();
    
    // Masquer la modale et l'overlay
    document.getElementById('reset-confirm-modal').classList.add('hidden');
    const overlay = document.getElementById('reset-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function cancelResetScores() {
    // Masquer la modale et l'overlay
    document.getElementById('reset-confirm-modal').classList.add('hidden');
    const overlay = document.getElementById('reset-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Groupes de la CAN 2025
let groupes = [
    {
        nom: "A",
        equipes: [
            { nom: "Comores", drapeau: "drapeaux/Comores.png" },
            { nom: "Mali", drapeau: "drapeaux/Mali.png" },
            { nom: "Maroc", drapeau: "drapeaux/Maroc.png" },
            { nom: "Zambie", drapeau: "drapeaux/Zambie.png" }
        ]
    },
    {
        nom: "B",
        equipes: [
            { nom: "Afrique du Sud", drapeau: "drapeaux/Afrique-du-Sud.png" },
            { nom: "Angola", drapeau: "drapeaux/Angola.png" },
            { nom: "Egypte", drapeau: "drapeaux/Egypte.png" },
            { nom: "Zimbabwe", drapeau: "drapeaux/Zimbabwe.png" }
        ]
    },
    {
        nom: "C",
        equipes: [
            { nom: "Nigeria", drapeau: "drapeaux/Nigeria.png" },
            { nom: "Ouganda", drapeau: "drapeaux/Ouganda.png" },
            { nom: "Tanzanie", drapeau: "drapeaux/Tanzanie.png" },
            { nom: "Tunisie", drapeau: "drapeaux/Tunisie.png" }
        ]
    },
    {
        nom: "D",
        equipes: [
            { nom: "Bénin", drapeau: "drapeaux/Benin.png" },
            { nom: "Botswana", drapeau: "drapeaux/Botswana.png" },
            { nom: "RD Congo", drapeau: "drapeaux/RD-Congo.png" },
            { nom: "Sénégal", drapeau: "drapeaux/Senegal.png" }
        ]
    },
    {
        nom: "E",
        equipes: [
            { nom: "Algérie", drapeau: "drapeaux/Algerie.png" },
            { nom: "Burkina Faso", drapeau: "drapeaux/Burkina-Faso.png" },
            { nom: "Guinée Equatoriale", drapeau: "drapeaux/Guinee-Equatoriale.png" },
            { nom: "Soudan", drapeau: "drapeaux/Soudan.png" }
        ]
    },
    {
        nom: "F",
        equipes: [
            { nom: "Cameroun", drapeau: "drapeaux/Cameroun.png" },
            { nom: "Côte d'Ivoire", drapeau: "drapeaux/Cote-d'Ivoire.png" },
            { nom: "Gabon", drapeau: "drapeaux/Gabon.png" },
            { nom: "Mozambique", drapeau: "drapeaux/Mozambique.png" }
        ]
    }
];

// Résultats des matchs de groupes - MODIFIEZ ICI APRÈS CHAQUE MATCH
// Format: { groupe: "A", home: "Maroc", away: "Zambie", scoreHome: 2, scoreAway: 1 }
let resultatsMatchs = [
    // Groupe A
    { groupe: "A", home: "Maroc", away: "Comores", scoreHome: 2, scoreAway: 0 },
    { groupe: "A", home: "Mali", away: "Zambie", scoreHome: 1, scoreAway: 1 },
    
    // Groupe B
    { groupe: "B", home: "Afrique du Sud", away: "Angola", scoreHome: 2, scoreAway: 1 },
    { groupe: "B", home: "Egypte", away: "Zimbabwe", scoreHome: 2, scoreAway: 1 },
    
    // Groupe C - Tunisie et ses matchs
    { groupe: "C", home: "Tunisie", away: "Ouganda", scoreHome: 3, scoreAway: 1 },
    { groupe: "C", home: "Nigeria", away: "Tanzanie", scoreHome: 2, scoreAway: 1 },
    
    // Groupe D
    { groupe: "D", home: "RD Congo", away: "Bénin", scoreHome: 1, scoreAway: 0 },
    { groupe: "D", home: "Sénégal", away: "Botswana", scoreHome: 3, scoreAway: 0 }
];

// Fonction pour calculer le classement d'un groupe
function calculerClassement(groupe) {
    const stats = {};
    
    // Initialiser les stats pour chaque équipe
    groupe.equipes.forEach(equipe => {
        stats[equipe.nom] = {
            nom: equipe.nom,
            drapeau: equipe.drapeau,
            matchsJoues: 0,
            victoires: 0,
            nuls: 0,
            defaites: 0,
            butsPour: 0,
            butsContre: 0,
            diff: 0,
            points: 0
        };
    });
    
    // Traiter chaque match du groupe
    resultatsMatchs.filter(m => m.groupe === groupe.nom).forEach(match => {
        if (stats[match.home] && stats[match.away]) {
            // Match joué
            stats[match.home].matchsJoues++;
            stats[match.away].matchsJoues++;
            
            stats[match.home].butsPour += match.scoreHome;
            stats[match.home].butsContre += match.scoreAway;
            stats[match.away].butsPour += match.scoreAway;
            stats[match.away].butsContre += match.scoreHome;
            
            if (match.scoreHome > match.scoreAway) {
                // Victoire home
                stats[match.home].victoires++;
                stats[match.home].points += 3;
                stats[match.away].defaites++;
            } else if (match.scoreHome < match.scoreAway) {
                // Victoire away
                stats[match.away].victoires++;
                stats[match.away].points += 3;
                stats[match.home].defaites++;
            } else {
                // Nul
                stats[match.home].nuls++;
                stats[match.away].nuls++;
                stats[match.home].points++;
                stats[match.away].points++;
            }
        }
    });
    
    // Calculer la différence de buts
    Object.values(stats).forEach(equipe => {
        equipe.diff = equipe.butsPour - equipe.butsContre;
    });
    
    // Trier par points, puis différence, puis buts pour
    const classement = Object.values(stats).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.diff !== a.diff) return b.diff - a.diff;
        return b.butsPour - a.butsPour;
    });
    
    return classement;
}

// Fonction pour abréger les noms trop longs
function abreviationEquipe(nom) {
    const abreviations = {
        "Afrique du Sud": "Afrique<br>du Sud",
        "Burkina Faso": "Burkina<br>Faso",
        "Côte d'Ivoire": "Côte<br>d'Ivoire",
        "Guinée Equatoriale": "Guinée<br>Equatoriale"
    };
    return abreviations[nom] || nom;
}

// Calendrier des matchs (matchs de Tunisie uniquement)
let matchs = [
    {
        date: "23/12/2025",
        heure: "21h00",
        home: "Tunisie",
        away: "Ouganda",
        homeFlag: "drapeaux/Tunisie.png",
        awayFlag: "drapeaux/Ouganda.png",
        stade: "Stade Moulay Hassan, Rabat",
        resultat: "3-1",
        status: "Match Terminé",
        lien: "#",
        liveUrl: "http://fl1.moveonjoy.com/BEIN_SPORTS/index.m3u8"
    },
    {
        date: "27/12/2025",
        heure: "21h00",
        home: "Tunisie",
        away: "Nigeria",
        homeFlag: "drapeaux/Tunisie.png",
        awayFlag: "drapeaux/Nigeria.png",
        stade: "Complexe sportif de Fès",
        resultat: "-",
        lien: "#",
        liveUrl: "http://fl1.moveonjoy.com/BEIN_SPORTS/index.m3u8"
    },
    {
        date: "30/12/2025",
        heure: "17h00",
        home: "Tunisie",
        away: "Tanzanie",
        homeFlag: "drapeaux/Tunisie.png",
        awayFlag: "drapeaux/Tanzanie.png",
        stade: "Stade Prince Moulay Abdallah, Rabat",
        resultat: "-",
        lien: "#",
        liveUrl: "http://fl1.moveonjoy.com/BEIN_SPORTS/index.m3u8"
    }
];

// FONCTION POUR MÉLANGER LE TABLEAU (Algorithme de Fisher-Yates)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showMenu() {
    console.log('showMenu() called');
    
    // Masquer tous les écrans
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });
    
    // Afficher le main-menu avec styles forcés
    const mainMenu = document.getElementById('main-menu');
    mainMenu.classList.remove('hidden');
    mainMenu.style.display = 'flex';
    mainMenu.style.width = '100%';
    mainMenu.style.alignItems = 'center';
    mainMenu.style.justifyContent = 'center';
    mainMenu.style.flexDirection = 'column';
    
    console.log('main-menu affiché avec styles forcés');
    
    document.getElementById('back-btn-floating').style.display = 'none';
    
    // Masquer le tableau des scores
    const scoresBoard = document.getElementById('scores-board');
    if (scoresBoard) {
        scoresBoard.classList.add('hidden');
    }
    
    // Afficher le profil avec le pseudo
    displayUserProfile();
    
    console.log('showMenu() complète');
}

function showQuizMenu() {
    // Vérifier la connexion
    if (!currentUser) {
        console.log('Accès refusé: utilisateur non connecté');
        logoutUser();
        return;
    }
    
    console.log('showQuizMenu() called');
    
    // Masquer tous les écrans
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });
    
    // Afficher le quiz-menu avec styles forcés
    const quizMenu = document.getElementById('quiz-menu');
    quizMenu.classList.remove('hidden');
    quizMenu.style.display = 'flex';
    quizMenu.style.width = '100%';
    quizMenu.style.alignItems = 'center';
    quizMenu.style.justifyContent = 'center';
    quizMenu.style.flexDirection = 'column';
    
    console.log('quiz-menu affiché avec styles forcés');
    
    document.getElementById('back-btn-floating').style.display = 'flex';
    
    // Afficher le tableau des scores
    const scoresBoard = document.getElementById('scores-board');
    if (scoresBoard) {
        scoresBoard.classList.remove('hidden');
    }
    
    // Afficher le profil avec le pseudo
    displayUserProfile();
    
    console.log('showQuizMenu() complète');
}

function showQuizMode() {
    // Vérifier la connexion
    if (!currentUser) {
        console.log('Accès refusé: utilisateur non connecté');
        logoutUser();
        return;
    }
    
    console.log('showQuizMode() called');
    
    // Masquer tous les écrans
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });
    
    // Afficher l'écran de sélection du mode - FORCER L'AFFICHAGE
    const modeScreen = document.getElementById('quiz-mode-screen');
    if (modeScreen) {
        modeScreen.classList.remove('hidden');
        modeScreen.style.display = 'flex';
        modeScreen.style.width = '100%';
        modeScreen.style.alignItems = 'center';
        modeScreen.style.justifyContent = 'center';
        modeScreen.style.flexDirection = 'column';
        console.log('quiz-mode-screen affichée avec styles forcés');
    } else {
        console.error('quiz-mode-screen NOT FOUND!');
    }
    
    // Afficher le bouton de retour
    const backBtn = document.getElementById('back-btn-floating');
    if (backBtn) {
        backBtn.style.display = 'flex';
    }
    
    // Afficher le tableau des scores
    const scoresBoard = document.getElementById('scores-board');
    if (scoresBoard) {
        scoresBoard.classList.remove('hidden');
    }
    
    // Afficher le profil avec le pseudo
    displayUserProfile();
    console.log('showQuizMode() complète');
}

function showQuizNameMode() {
    // Vérifier la connexion
    if (!currentUser) {
        console.log('Accès refusé: utilisateur non connecté');
        logoutUser();
        return;
    }
    
    console.log('showQuizNameMode() called');
    
    // Masquer tous les écrans
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });
    
    // Afficher l'écran de sélection du mode - FORCER L'AFFICHAGE
    const nameModeScreen = document.getElementById('quiz-name-mode-screen');
    if (nameModeScreen) {
        nameModeScreen.classList.remove('hidden');
        nameModeScreen.style.display = 'flex';
        nameModeScreen.style.width = '100%';
        nameModeScreen.style.alignItems = 'center';
        nameModeScreen.style.justifyContent = 'center';
        nameModeScreen.style.flexDirection = 'column';
        console.log('quiz-name-mode-screen affichée avec styles forcés');
    } else {
        console.error('quiz-name-mode-screen NOT FOUND!');
    }
    
    // Afficher le bouton de retour
    const backBtn = document.getElementById('back-btn-floating');
    if (backBtn) {
        backBtn.style.display = 'flex';
    }
    
    // Afficher le tableau des scores
    const scoresBoard = document.getElementById('scores-board');
    if (scoresBoard) {
        scoresBoard.classList.remove('hidden');
    }
    
    // Afficher le profil avec le pseudo
    displayUserProfile();
    console.log('showQuizNameMode() complète');
}

function showList() {
    // Vérifier la connexion
    if (!currentUser) {
        console.log('Accès refusé: utilisateur non connecté');
        logoutUser();
        return;
    }
    
    console.log('showList() called');
    
    // Masquer tous les écrans
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });
    
    // Afficher le list-screen avec styles forcés
    const listScreen = document.getElementById('list-screen');
    listScreen.classList.remove('hidden');
    listScreen.style.display = 'flex';
    listScreen.style.width = '100%';
    listScreen.style.alignItems = 'center';
    listScreen.style.justifyContent = 'center';
    listScreen.style.flexDirection = 'column';
    
    console.log('list-screen affiché avec styles forcés');
    
    document.getElementById('back-btn-floating').style.display = 'flex';
    const container = document.getElementById('players-list-container');
    container.innerHTML = "";
    
    // Grouper les joueurs par poste
    const categories = {
        "Gardien": [],
        "Défenseur": [],
        "Milieu": [],
        "Attaquant": []
    };
    
    joueurs.forEach(j => {
        if (categories[j.poste]) {
            categories[j.poste].push(j);
        }
    });
    
    // Afficher chaque catégorie
    Object.entries(categories).forEach(([poste, players]) => {
        if (players.length > 0) {
            // Créer la section de catégorie
            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';
            
            const categoryTitle = document.createElement('h2');
            categoryTitle.className = 'category-title';
            // Gestion du pluriel en français (Milieu -> Milieux)
            if (poste === 'Milieu') {
                categoryTitle.textContent = 'Milieux';
            } else {
                categoryTitle.textContent = poste + 's';
            }
            categorySection.appendChild(categoryTitle);
            
            const categoryGrid = document.createElement('div');
            categoryGrid.className = 'category-grid';
            
            players.forEach(j => {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'player-item clickable';
                playerDiv.onclick = () => showPlayerDetails(j.nom);
                playerDiv.innerHTML = `
                    <img src="photos/${j.fichier}" onerror="this.src='https://via.placeholder.com/70?text=Erreur'">
                    <div><strong>${j.nom}</strong><br><small>${j.club}</small></div>
                `;
                categoryGrid.appendChild(playerDiv);
            });
            
            categorySection.appendChild(categoryGrid);
            container.appendChild(categorySection);
        }
    });
}

function showCalendar() {
    // Vérifier la connexion
    if (!currentUser) {
        console.log('Accès refusé: utilisateur non connecté');
        logoutUser();
        return;
    }
    
    console.log('showCalendar() called');
    
    // Masquer tous les écrans
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });
    
    // Afficher le calendar-screen avec styles forcés
    const calendarScreen = document.getElementById('calendar-screen');
    calendarScreen.classList.remove('hidden');
    calendarScreen.style.display = 'flex';
    calendarScreen.style.width = '100%';
    calendarScreen.style.alignItems = 'center';
    calendarScreen.style.justifyContent = 'center';
    calendarScreen.style.flexDirection = 'column';
    
    console.log('calendar-screen affiché avec styles forcés');
    
    document.getElementById('back-btn-floating').style.display = 'flex';
    const container = document.getElementById('calendar-container');
    container.innerHTML = "";
    
    // Créer la section de catégorie "Phase de poules"
    const categorySection = document.createElement('div');
    categorySection.className = 'category-section';
    
    const categoryTitle = document.createElement('h2');
    categoryTitle.className = 'category-title';
    categoryTitle.textContent = "Phase de poules";
    categorySection.appendChild(categoryTitle);
    
    const categoryGrid = document.createElement('div');
    categoryGrid.className = 'category-grid';
    
    matchs.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        
        // Ajouter l'événement de clic pour ouvrir le lecteur vidéo (seulement si pas terminé)
        if (match.liveUrl && match.liveUrl !== '#' && match.status !== 'Match Terminé') {
            matchCard.style.cursor = 'pointer';
            matchCard.onclick = () => {
                openVideoPlayer(match.liveUrl);
            };
        } else if (match.status === 'Match Terminé') {
            matchCard.style.opacity = '0.8';
            matchCard.style.cursor = 'default';
        }
        
        matchCard.innerHTML = `
            <div class="match-title">${match.home}-${match.away}</div>
            <div class="match-content">
                <div class="match-flags">
                    <img src="${match.homeFlag}" alt="${match.home}" class="flag-img">
                    <img src="${match.awayFlag}" alt="${match.away}" class="flag-img">
                </div>
                <div class="match-date-time">
                    <div class="match-date">${match.date}</div>
                    <div class="match-heure">${match.heure}</div>
                </div>
            </div>
            <div class="match-stade">${match.stade}</div>
            ${match.status ? `<div class="match-status">${match.status}</div>` : ''}
            ${match.resultat && match.resultat !== '-' ? `<div class="match-resultat">${match.resultat}</div>` : ''}
        `;
        categoryGrid.appendChild(matchCard);
    });
    
    categorySection.appendChild(categoryGrid);
    container.appendChild(categorySection);
}

function showGroups() {
    // Vérifier la connexion
    if (!currentUser) {
        console.log('Accès refusé: utilisateur non connecté');
        logoutUser();
        return;
    }
    
    console.log('showGroups() called');
    
    // Masquer tous les écrans
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });
    
    // Afficher le groups-screen avec styles forcés
    const groupsScreen = document.getElementById('groups-screen');
    groupsScreen.classList.remove('hidden');
    groupsScreen.style.display = 'flex';
    groupsScreen.style.width = '100%';
    groupsScreen.style.alignItems = 'center';
    groupsScreen.style.justifyContent = 'center';
    groupsScreen.style.flexDirection = 'column';
    
    console.log('groups-screen affiché avec styles forcés');
    
    document.getElementById('back-btn-floating').style.display = 'flex';
    const container = document.getElementById('groups-container');
    container.innerHTML = "";
    
    groupes.forEach(groupe => {
        const groupeSection = document.createElement('div');
        groupeSection.className = 'groupe-card';
        
        const groupeTitle = document.createElement('h3');
        groupeTitle.className = 'groupe-title';
        groupeTitle.textContent = `Groupe ${groupe.nom}`;
        groupeSection.appendChild(groupeTitle);
        
        // Calculer le classement
        const classement = calculerClassement(groupe);
        
        // Créer le tableau de classement
        const table = document.createElement('table');
        table.className = 'classement-table';
        
        // En-tête
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th class="pos-col"></th>
                <th class="equipe-col">Équipes</th>
                <th class="stat-col">V</th>
                <th class="stat-col">N</th>
                <th class="stat-col">D</th>
                <th class="stat-col">Diff</th>
                <th class="pts-col">Pts</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Corps du tableau
        const tbody = document.createElement('tbody');
        classement.forEach((equipe, index) => {
            const tr = document.createElement('tr');
            // Ajouter une classe pour les qualifiés (1er et 2e)
            if (index < 2) {
                tr.classList.add('qualifie');
            }
            
            // Rendre la ligne Tunisie cliquable
            if (equipe.nom === 'Tunisie') {
                tr.classList.add('tunisie-cliquable');
                tr.onclick = () => showList();
                tr.style.cursor = 'pointer';
            }
            
            const diffClass = equipe.diff > 0 ? 'diff-positive' : equipe.diff < 0 ? 'diff-negative' : '';
            
            tr.innerHTML = `
                <td class="pos-col"><span class="position">${index + 1}</span></td>
                <td class="equipe-col">
                    <img src="${equipe.drapeau}" alt="${equipe.nom}" class="mini-flag">
                    <span class="equipe-nom-table">${abreviationEquipe(equipe.nom)}</span>
                </td>
                <td class="stat-col">${equipe.victoires}</td>
                <td class="stat-col">${equipe.nuls}</td>
                <td class="stat-col">${equipe.defaites}</td>
                <td class="stat-col ${diffClass}">${equipe.diff > 0 ? '+' : ''}${equipe.diff}</td>
                <td class="pts-col"><strong>${equipe.points}</strong></td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        groupeSection.appendChild(table);
        container.appendChild(groupeSection);
    });
}

function showPlayerDetails(nomJoueur) {
    const joueur = joueurs.find(j => j.nom === nomJoueur);
    if (!joueur) return;
    
    document.getElementById('detail-modal').classList.remove('hidden');
    document.getElementById('detail-nom').textContent = joueur.nom;
    document.getElementById('detail-poste').textContent = joueur.poste;
    document.getElementById('detail-age').textContent = joueur.age + " ans";
    document.getElementById('detail-taille').textContent = joueur.taille;
    document.getElementById('detail-pied').textContent = joueur.pied;
    document.getElementById('detail-club-text').textContent = joueur.club;
    document.getElementById('detail-club-logo').src = "Clubs/" + joueur.logoClub;
    document.getElementById('detail-club-logo').onerror = function() { this.style.display = 'none'; };
    document.getElementById('detail-photo').src = "photos/" + joueur.fichier;
}

function closePlayerDetails() {
    document.getElementById('detail-modal').classList.add('hidden');
}

function filterByPosition(position) {
    closePlayerDetails();
    showList();
    
    // Scroll vers la catégorie
    setTimeout(() => {
        const categoryTitles = document.querySelectorAll('.category-title');
        categoryTitles.forEach(title => {
            if (title.textContent.toLowerCase().includes(position.toLowerCase())) {
                title.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }, 100);
}

function goBack() {
    console.log('goBack() called');
    
    // Trouver l'écran actif en vérifiant les classe et les styles inline
    let activeScreen = null;
    const screens = document.querySelectorAll('.screen');
    
    for (let screen of screens) {
        const computedStyle = window.getComputedStyle(screen);
        const isHidden = screen.classList.contains('hidden') || computedStyle.display === 'none';
        if (!isHidden) {
            activeScreen = screen;
            console.log('Active screen found:', activeScreen.id);
            break;
        }
    }
    
    if (!activeScreen) {
        console.log('No active screen found, cannot navigate back');
        return;
    }
    
    if (activeScreen.id === 'main-menu') {
        // Si on est déjà au menu principal, rien à faire
        console.log('Already at main menu');
        return;
    } else if (activeScreen.id === 'quiz-menu' || activeScreen.id === 'list-screen' || activeScreen.id === 'calendar-screen' || activeScreen.id === 'groups-screen') {
        // Si on est au menu quiz, à la liste, au calendrier ou aux groupes, retour au menu principal
        console.log('Going back to main menu from:', activeScreen.id);
        showMenu();
    } else if (activeScreen.id === 'quiz-screen' || activeScreen.id === 'quiz-name-screen' || activeScreen.id === 'quiz-mode-screen') {
        // Si on est en quiz, retour au menu quiz
        console.log('Going back to quiz menu from:', activeScreen.id);
        showQuizMenu();
    } else {
        console.log('Unknown screen, going back to main menu:', activeScreen.id);
        showMenu();
    }
}

function startQuizGuessImage(mode = 'all', category = null) {
    // Vérifier la connexion
    if (!currentUser) {
        console.log('Accès refusé: utilisateur non connecté');
        logoutUser();
        return;
    }
    
    console.log('startQuizGuessImage() appelée avec mode:', mode, 'category:', category);
    
    currentQuizMode = mode;
    currentQuizCategory = category;
    if (mode === 'category' && category) {
        quizPlayersGlobal = joueurs.filter(j => j.poste === category);
    } else {
        quizPlayersGlobal = joueurs.slice();
    }
    shuffle(quizPlayersGlobal);
    
    // Masquer tous les écrans
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });
    
    // Afficher l'écran du quiz - FORCER L'AFFICHAGE
    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) {
        quizScreen.classList.remove('hidden');
        quizScreen.style.display = 'flex';
        quizScreen.style.width = '100%';
        quizScreen.style.alignItems = 'center';
        quizScreen.style.justifyContent = 'center';
        quizScreen.style.flexDirection = 'column';
        console.log('quiz-screen affichée');
    } else {
        console.error('quiz-screen NOT FOUND!');
    }
    
    quizIndex = 0;
    quizScore = 0; // Réinitialiser le score
    quizStartTime = Date.now(); // Enregistrer l'heure de début
    loadQuizPlayerImage();
}

function startQuizGuessName(mode = 'all', category = null) {
    // Vérifier la connexion
    if (!currentUser) {
        console.log('Accès refusé: utilisateur non connecté');
        logoutUser();
        return;
    }
    
    console.log('startQuizGuessName() appelée avec mode:', mode, 'category:', category);
    
    currentQuizMode = mode;
    currentQuizCategory = category;
    if (mode === 'category' && category) {
        quizPlayersGlobal = joueurs.filter(j => j.poste === category);
    } else {
        quizPlayersGlobal = [...joueurs];
    }
    shuffle(quizPlayersGlobal);
    
    // Masquer tous les écrans
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });
    
    // Afficher l'écran du quiz nom - FORCER L'AFFICHAGE
    const quizNameScreen = document.getElementById('quiz-name-screen');
    if (quizNameScreen) {
        quizNameScreen.classList.remove('hidden');
        quizNameScreen.style.display = 'flex';
        quizNameScreen.style.width = '100%';
        quizNameScreen.style.alignItems = 'center';
        quizNameScreen.style.justifyContent = 'center';
        quizNameScreen.style.flexDirection = 'column';
        console.log('quiz-name-screen affichée');
    } else {
        console.error('quiz-name-screen NOT FOUND!');
    }
    
    quizIndex = 0;
    quizScore = 0; // Réinitialiser le score
    quizStartTime = Date.now(); // Enregistrer l'heure de début
    loadQuizPlayerName();
}

function loadQuizPlayerImage() {
    if (quizIndex < quizPlayersGlobal.length) {
        const j = quizPlayersGlobal[quizIndex];
        document.getElementById('quiz-player-name').textContent = j.nom;
        document.getElementById('quiz-feedback').textContent = "";
        document.getElementById('quiz-score').textContent = `Joueur ${quizIndex + 1} / ${quizPlayersGlobal.length}`;
        
        // Créer une grille avec 9 joueurs (le bon + autres disponibles)
        const grid = document.getElementById('quiz-players-grid');
        grid.innerHTML = "";
        
        // Sélectionner autres joueurs aléatoires (en excluant le bon)
        const otherPlayers = quizPlayersGlobal.filter(p => p.nom !== j.nom);
        const randomOthers = otherPlayers.sort(() => Math.random() - 0.5).slice(0, 8);
        
        // Créer un tableau avec le bon joueur + autres
        const quizPlayers = [j, ...randomOthers].sort(() => Math.random() - 0.5);
        
        quizPlayers.forEach((player) => {
            const div = document.createElement('div');
            div.className = 'quiz-player-option';
            div.innerHTML = `<img src="photos/${player.fichier}" alt="${player.nom}">`;
            
            div.onclick = () => checkAnswerInversed(player, j, div);
            grid.appendChild(div);
        });
    } else {
        // Quiz terminé - Afficher l'écran de fin
        console.log('Fin du quiz détectée! quizIndex:', quizIndex, 'length:', quizPlayersGlobal.length);
        showQuizEnd();
    }
}

function showQuizEnd() {
    console.log('=== showQuizEnd() START ===');
    
    try {
        // Données du quiz
        const totalQuestions = quizPlayersGlobal.length;
        const maxPoints = totalQuestions;
        const percentage = Math.round((quizScore / maxPoints) * 100);
        
        // Calculer le temps écoulé
        quizEndTime = Date.now();
        const elapsedSeconds = Math.floor((quizEndTime - quizStartTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        const timeString = `${minutes}m ${seconds}s`;
        
        // Enregistrer le score
        const categoryName = currentQuizCategory || 'Tous';
        console.log('Enregistrement du score:', {quizScore, maxPoints, categoryName});
        addScoreToHistory('trouver', categoryName, quizScore, maxPoints);
        
        // ÉTAPE 1: Créer/afficher l'overlay
        console.log('Étape 1: Création de l\'overlay');
        let overlay = document.getElementById('quiz-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'quiz-overlay';
            overlay.setAttribute('style', 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background-color: rgba(0, 0, 0, 0.7) !important; z-index: 999 !important; display: block !important;');
            document.body.appendChild(overlay);
            console.log('Overlay créé et ajouté');
        } else {
            overlay.style.display = 'block';
            console.log('Overlay existant rendu visible');
        }
        
        // ÉTAPE 2: Masquer tous les écrans
        console.log('Étape 2: Masquage des écrans');
        const screens = document.querySelectorAll('.screen');
        console.log('Écrans trouvés:', screens.length);
        screens.forEach((s, index) => {
            s.setAttribute('style', 'display: none !important;');
            console.log('Écran', index, 'masqué');
        });
        
        // ÉTAPE 3: Afficher la modale
        console.log('Étape 3: Affichage de la modale');
        const modal = document.getElementById('quiz-end-modal');
        console.log('Modal trouvée:', !!modal);
        
        if (modal) {
            // Retirer la classe hidden
            modal.classList.remove('hidden');
            console.log('Classe "hidden" retirée');
            
            // Forcer tous les styles
            modal.setAttribute('style', 'position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; z-index: 1000 !important; display: block !important; max-width: 500px !important; width: 90% !important; margin: 0 !important; padding: 40px 35px !important; background-color: rgba(255, 255, 255, 0.95) !important; background-image: url(fond-cases-blanche.png) !important; background-size: cover !important; background-position: center !important; border-radius: 15px !important; box-shadow: 0 20px 60px rgba(0,0,0,0.4) !important; pointer-events: auto !important;');
            console.log('Styles appliqués à la modale');
            
            // ÉTAPE 4: Remplir les données
            console.log('Étape 4: Remplissage des données');
            const titleElem = document.getElementById('quiz-end-title');
            const scoreElem = document.getElementById('quiz-end-score');
            const percentageElem = document.getElementById('quiz-end-percentage');
            const timeElem = document.getElementById('quiz-end-time');
            
            if (titleElem) {
                titleElem.textContent = `Quiz Trouver le Joueur - ${categoryName}`;
                console.log('✓ Titre rempli');
            } else {
                console.error('✗ quiz-end-title NOT FOUND');
            }
            
            if (scoreElem) {
                scoreElem.textContent = `${quizScore} / ${maxPoints} points`;
                console.log('✓ Score rempli:', scoreElem.textContent);
            } else {
                console.error('✗ quiz-end-score NOT FOUND');
            }
            
            if (percentageElem) {
                percentageElem.textContent = `${percentage}% de réussite`;
                console.log('✓ Pourcentage rempli');
            } else {
                console.error('✗ quiz-end-percentage NOT FOUND');
            }
            
            if (timeElem) {
                timeElem.textContent = `Temps: ${timeString}`;
                console.log('✓ Temps rempli');
            } else {
                console.error('✗ quiz-end-time NOT FOUND');
            }
            
            console.log('=== showQuizEnd() SUCCESS ===');
        } else {
            console.error('✗✗✗ MODAL quiz-end-modal NOT FOUND ✗✗✗');
        }
    } catch (error) {
        console.error('=== showQuizEnd() ERROR ===', error);
    }
}

function goBackToQuizMode() {
    console.log('goBackToQuizMode() appelée');
    
    // Masquer la modale et l'overlay
    const modal = document.getElementById('quiz-end-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('style', 'display: none !important;');
        console.log('Modale masquée');
    }
    
    const overlay = document.getElementById('quiz-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        console.log('Overlay masqué');
    }
    
    // Retour au menu de sélection du mode
    console.log('Appel de showQuizMode()');
    showQuizMode();
}

function showQuizEndName() {
    console.log('=== showQuizEndName() START ===');
    
    try {
        quizEndTime = Date.now();
        const totalQuestions = quizPlayersGlobal.length;
        const maxPoints = totalQuestions * (currentQuizMode === 'all' ? 3 : 2);
        const percentage = Math.round((quizScore / maxPoints) * 100);
        
        // Calculer le temps écoulé
        const elapsedSeconds = Math.floor((quizEndTime - quizStartTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        const timeString = `${minutes}m ${seconds}s`;
        
        // Enregistrer le score
        const categoryName = currentQuizCategory || 'Tous';
        console.log('Enregistrement du score:', {quizScore, maxPoints, categoryName});
        addScoreToHistory('trouver_nom', categoryName, quizScore, maxPoints);
        
        // ÉTAPE 1: Créer/afficher l'overlay
        console.log('Étape 1: Création de l\'overlay');
        let overlay = document.getElementById('quiz-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'quiz-overlay';
            overlay.setAttribute('style', 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background-color: rgba(0, 0, 0, 0.7) !important; z-index: 999 !important; display: block !important;');
            document.body.appendChild(overlay);
            console.log('Overlay créé et ajouté');
        } else {
            overlay.style.display = 'block';
            console.log('Overlay existant rendu visible');
        }
        
        // ÉTAPE 2: Masquer tous les écrans
        console.log('Étape 2: Masquage des écrans');
        const screens = document.querySelectorAll('.screen');
        console.log('Écrans trouvés:', screens.length);
        screens.forEach((s, index) => {
            s.setAttribute('style', 'display: none !important;');
            console.log('Écran', index, 'masqué');
        });
        
        // ÉTAPE 3: Afficher la modale
        console.log('Étape 3: Affichage de la modale');
        const modal = document.getElementById('quiz-end-name-modal');
        console.log('Modal trouvée:', !!modal);
        
        if (modal) {
            // Retirer la classe hidden
            modal.classList.remove('hidden');
            console.log('Classe "hidden" retirée');
            
            // Forcer tous les styles
            modal.setAttribute('style', 'position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; z-index: 1000 !important; display: block !important; max-width: 500px !important; width: 90% !important; margin: 0 !important; padding: 40px 35px !important; background-color: rgba(255, 255, 255, 0.95) !important; background-image: url(fond-cases-blanche.png) !important; background-size: cover !important; background-position: center !important; border-radius: 15px !important; box-shadow: 0 20px 60px rgba(0,0,0,0.4) !important; pointer-events: auto !important;');
            console.log('Styles appliqués à la modale');
            
            // ÉTAPE 4: Remplir les données
            console.log('Étape 4: Remplissage des données');
            const titleElem = document.getElementById('quiz-end-name-title');
            const scoreElem = document.getElementById('quiz-end-name-score');
            const percentageElem = document.getElementById('quiz-end-name-percentage');
            const timeElem = document.getElementById('quiz-end-name-time');
            
            if (titleElem) {
                titleElem.textContent = `Quiz "Trouver le Nom" - ${categoryName}`;
                console.log('✓ Titre rempli');
            } else {
                console.error('✗ quiz-end-name-title NOT FOUND');
            }
            
            if (scoreElem) {
                scoreElem.textContent = `${quizScore} / ${maxPoints} points`;
                console.log('✓ Score rempli:', scoreElem.textContent);
            } else {
                console.error('✗ quiz-end-name-score NOT FOUND');
            }
            
            if (percentageElem) {
                percentageElem.textContent = `${percentage}% de réussite`;
                console.log('✓ Pourcentage rempli');
            } else {
                console.error('✗ quiz-end-name-percentage NOT FOUND');
            }
            
            if (timeElem) {
                timeElem.textContent = `Temps: ${timeString}`;
                console.log('✓ Temps rempli');
            } else {
                console.error('✗ quiz-end-name-time NOT FOUND');
            }
            
            console.log('=== showQuizEndName() SUCCESS ===');
        } else {
            console.error('✗✗✗ MODAL quiz-end-name-modal NOT FOUND ✗✗✗');
        }
    } catch (error) {
        console.error('=== showQuizEndName() ERROR ===', error);
    }
}

function goBackToQuizNameMode() {
    console.log('goBackToQuizNameMode() appelée');
    
    // Masquer la modale et l'overlay
    const modal = document.getElementById('quiz-end-name-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('style', 'display: none !important;');
        console.log('Modale masquée');
    }
    
    const overlay = document.getElementById('quiz-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        console.log('Overlay masqué');
    }
    
    // Retour au menu de sélection du mode
    console.log('Appel de showQuizNameMode()');
    showQuizNameMode();
}

function loadQuizPlayerName() {
    if (quizIndex < quizPlayersGlobal.length) {
        const j = quizPlayersGlobal[quizIndex];
        document.getElementById('quiz-img').src = "photos/" + j.fichier;
        document.getElementById('input-nom').value = "";
        document.getElementById('input-poste').value = "";
        document.getElementById('input-club').value = "";
        document.getElementById('quiz-feedback-name').textContent = "";
        document.getElementById('quiz-score-name').textContent = `Joueur ${quizIndex + 1} / ${quizPlayersGlobal.length}`;
        document.getElementById('current-score-name').textContent = quizScore;
        
        // Masquer le champ poste si on joue une catégorie spécifique
        const posteInput = document.getElementById('input-poste');
        if (currentQuizMode === 'category') {
            posteInput.style.display = 'none';
        } else {
            posteInput.style.display = 'block';
        }
        
        document.getElementById('input-nom').focus();
    } else {
        // Quiz terminé - Afficher l'écran de fin
        showQuizEndName();
    }
}

function checkAnswerInversed(selectedPlayer, correctPlayer, element) {
    if (selectedPlayer.nom === correctPlayer.nom) {
        element.classList.add('selected');
        document.getElementById('quiz-feedback').innerHTML = `<span class='correct'>JUSTE</span>`;
        quizScore++; // Incrémenter le score
        quizIndex++;
        setTimeout(loadQuizPlayerImage, 800);
    } else {
        element.classList.add('wrong');
        
        // Trouver et entourer en vert la bonne réponse
        const allOptions = document.querySelectorAll('.quiz-player-option');
        allOptions.forEach(option => {
            const img = option.querySelector('img');
            if (img.alt === correctPlayer.nom) {
                option.classList.add('correct-answer');
            }
        });
        
        document.getElementById('quiz-feedback').innerHTML = `<span class='wrong'>FAUX</span>`;
        setTimeout(() => { quizIndex++; loadQuizPlayerImage(); }, 2000);
    }
}

function checkAnswerName() {
    const j = quizPlayersGlobal[quizIndex];
    const nomVal = document.getElementById('input-nom').value.trim().toLowerCase();
    const posteVal = document.getElementById('input-poste').value.trim().toLowerCase();
    const clubVal = document.getElementById('input-club').value.trim().toLowerCase();

    // On prépare les réponses correctes sans accents pour faciliter
    const nomComplet = j.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const inputClean = nomVal.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Préparer le club pour la comparaison
    const clubComplet = j.club.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const clubInputClean = clubVal.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const quizCard = document.querySelector('#quiz-name-screen .quiz-card');
    
    // SI TOUS LES CHAMPS SONT VIDES : on passe directement au suivant en montrant la réponse
    if (nomVal === "" && posteVal === "" && clubVal === "") {
        quizCard.classList.add('flash-red');
        showPlayerDetails(j.nom);
        setTimeout(() => {
            quizCard.classList.remove('flash-red');
            quizIndex++;
            loadQuizPlayerName();
        }, 2000);
        return;
    }

    // Calcul des points
    let pointsGagnes = 0;
    
    // Vérification du nom (1 point) - accepter nom complet ou nom de famille
    const nomEstCorrect = (nomVal !== "" && nomComplet.includes(inputClean) && inputClean.length >= 3);
    if (nomEstCorrect) pointsGagnes += 1;
    
    // Vérification du poste (1 point) - seulement si on joue "Tous"
    if (currentQuizMode === 'all') {
        const posteEstCorrect = (posteVal !== "" && posteVal === j.poste.toLowerCase());
        if (posteEstCorrect) pointsGagnes += 1;
    }
    
    // Vérification du club (1 point)
    const clubEstCorrect = (clubVal !== "" && clubInputClean === clubComplet);
    if (clubEstCorrect) pointsGagnes += 1;

    // Ajouter les points au score total
    quizScore += pointsGagnes;

    if (pointsGagnes > 0) {
        quizCard.classList.add('flash-green');
        setTimeout(() => {
            quizCard.classList.remove('flash-green');
            quizIndex++;
            loadQuizPlayerName();
        }, 900);
    } else {
        // Si aucun point n'a été gagné
        quizCard.classList.add('flash-red');
        showPlayerDetails(j.nom);
        setTimeout(() => {
            quizCard.classList.remove('flash-red');
            quizIndex++;
            loadQuizPlayerName();
        }, 2000);
    }
}

// Event listeners pour le mode "Trouver le Nom"
document.addEventListener('DOMContentLoaded', function() {
    const inputNom = document.getElementById('input-nom');
    const inputPoste = document.getElementById('input-poste');
    const inputClub = document.getElementById('input-club');
    
    if (inputNom) {
        inputNom.addEventListener('keypress', e => { 
            if(e.key === 'Enter') {
                // Si le champ poste est visible, focus dessus, sinon sur le club
                if (inputPoste.style.display !== 'none') {
                    inputPoste.focus();
                } else {
                    inputClub.focus();
                }
            }
        });
    }
    
    if (inputPoste) {
        inputPoste.addEventListener('keypress', e => { 
            if(e.key === 'Enter') inputClub.focus(); 
        });
    }
    
    if (inputClub) {
        inputClub.addEventListener('keypress', e => { 
            if(e.key === 'Enter') checkAnswerName(); 
        });
    }
});

// Fonctions pour le lecteur vidéo
let player = null;
let hideControlsTimeout = null;

function openVideoPlayer(videoUrl) {
    const videoModal = document.getElementById('video-modal');
    
    videoModal.classList.remove('hidden');
    
    // Détruire le lecteur précédent s'il existe
    if (player) {
        player.dispose();
        player = null;
    }
    
    // Initialiser Video.js sans contrôles par défaut
    player = videojs('video-player', {
        controls: false,
        autoplay: true,
        preload: 'auto',
        fluid: true,
        html5: {
            vhs: {
                overrideNative: true
            },
            nativeVideoTracks: false,
            nativeAudioTracks: false,
            nativeTextTracks: false
        }
    });
    
    // Charger la source
    player.src({
        src: videoUrl,
        type: 'application/x-mpegURL'
    });
    
    player.ready(function() {
        console.log('Lecteur prêt');
        this.play();
        
        // Gérer l'affichage des contrôles au mouvement de souris
        const videoContainer = document.querySelector('.video-modal-content');
        const customControls = document.querySelector('.custom-controls');
        const closeBtn = document.querySelector('.video-modal-content .close-btn');
        
        function showControls() {
            customControls.classList.remove('fade-out');
            closeBtn.classList.remove('fade-out');
            
            // Clear timeout précédent
            if (hideControlsTimeout) {
                clearTimeout(hideControlsTimeout);
            }
            
            // Masquer après 3 secondes d'inactivité seulement en plein écran
            hideControlsTimeout = setTimeout(() => {
                if (player && player.isFullscreen()) {
                    customControls.classList.add('fade-out');
                    closeBtn.classList.add('fade-out');
                }
            }, 3000);
        }
        
        videoContainer.addEventListener('mousemove', showControls);
        videoContainer.addEventListener('click', showControls);
        
        // Afficher les contrôles au début
        showControls();
    });
    
    player.on('error', function() {
        console.error('Erreur de lecture:', player.error());
    });
}

function closeVideoPlayer() {
    const videoModal = document.getElementById('video-modal');
    
    // Clear timeout
    if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
        hideControlsTimeout = null;
    }
    
    // Arrêter et détruire le lecteur
    if (player) {
        player.pause();
        player.dispose();
        player = null;
    }
    
    videoModal.classList.add('hidden');
}

function toggleMute() {
    if (player) {
        if (player.muted()) {
            player.muted(false);
            document.querySelector('#custom-volume-btn img').style.opacity = '1';
        } else {
            player.muted(true);
            document.querySelector('#custom-volume-btn img').style.opacity = '0.5';
        }
    }
}

// Gestion des modales de ville/stade
let cityMatchesData = {
    'rabat': [
        {
            stadium: 'Maroc/Hassan.png',
            home: 'Tunisie',
            away: 'Ouganda',
            homeFlag: 'drapeaux/Tunisie.png',
            awayFlag: 'drapeaux/Ouganda.png',
            date: '23/12/2025',
            time: '21h00',
            location: 'Stade Hassan II - Rabat',
            score: '3-1',
            status: 'Match Terminé'
        },
        {
            stadium: 'Maroc/Abdallah.png',
            home: 'Tunisie',
            away: 'Tanzanie',
            homeFlag: 'drapeaux/Tunisie.png',
            awayFlag: 'drapeaux/Tanzanie.png',
            date: '27/12/2025',
            time: '18h00',
            location: 'Stade Prince Moulay Abdallah - Rabat'
        }
    ],
    'fes': [
        {
            stadium: 'Maroc/CSF.jpg',
            home: 'Tunisie',
            away: 'Nigeria',
            homeFlag: 'drapeaux/Tunisie.png',
            awayFlag: 'drapeaux/Nigeria.png',
            date: '31/12/2025',
            time: '20h00',
            location: 'Complexe Sportif de Fès'
        }
    ]
};

let currentCity = '';
let currentMatchIndex = 0;

function openCityModal(city) {
    currentCity = city;
    currentMatchIndex = 0;
    document.getElementById('city-modal').classList.remove('hidden');
    updateCityMatchDisplay();
}

function closeCityModal() {
    document.getElementById('city-modal').classList.add('hidden');
}

function switchCityMatch() {
    const matches = cityMatchesData[currentCity];
    
    // Alterner entre les matchs
    currentMatchIndex++;
    if (currentMatchIndex >= matches.length) {
        currentMatchIndex = 0;
    }
    
    updateCityMatchDisplay();
}

function updateCityMatchDisplay() {
    const matches = cityMatchesData[currentCity];
    const match = matches[currentMatchIndex];
    
    // Mettre à jour l'image du stade
    document.getElementById('stadium-bg').src = match.stadium;
    
    // Mettre à jour le titre
    document.getElementById('city-match-title').textContent = `${match.home} - ${match.away}`;
    
    // Mettre à jour les drapeaux
    document.getElementById('city-match-flags').innerHTML = `
        <img src="${match.homeFlag}" alt="${match.home}">
        <img src="${match.awayFlag}" alt="${match.away}">
    `;
    
    // Mettre à jour les détails avec score et statut si disponibles
    let detailsHTML = `
        <div>${match.date} - ${match.time}</div>
        <div style="margin-top: 10px;">${match.location}</div>
    `;
    
    if (match.score) {
        detailsHTML += `<div style="margin-top: 15px; font-size: 48px; font-weight: bold; color: #FFD700; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">${match.score}</div>`;
    }
    
    if (match.status) {
        detailsHTML += `<div style="margin-top: 10px; font-size: 14px; color: #4CAF50; font-weight: bold;">${match.status}</div>`;
    }
    
    document.getElementById('city-match-details').innerHTML = detailsHTML;
    
    // Mettre à jour l'indicateur et la direction de la flèche
    if (matches.length > 1) {
        document.getElementById('match-indicator').textContent = '';
        document.getElementById('city-match-nav').style.display = 'flex';
        
        const arrow = document.getElementById('city-nav-arrow');
        // Si on est au premier match, flèche vers la droite, sinon vers la gauche
        if (currentMatchIndex === 0) {
            arrow.classList.remove('rotate-left');
            arrow.classList.add('rotate-right');
        } else {
            arrow.classList.remove('rotate-right');
            arrow.classList.add('rotate-left');
        }
    } else {
        document.getElementById('city-match-nav').style.display = 'none';
    }
}

function toggleFullscreen() {
    if (player) {
        if (player.isFullscreen()) {
            player.exitFullscreen();
        } else {
            player.requestFullscreen();
        }
    }
}

// Initialisation au démarrage
loadUserData(); // Charger les données de l'utilisateur
loadScoresFromStorage();
updateScoresDisplay();
initEmailJS(); // Initialiser EmailJS

// Afficher l'écran approprié
if (currentUser) {
    // Utilisateur connecté: montrer le menu
    console.log('User déjà connecté au démarrage:', currentUser.email);
    showMenu();
    updateUserButtonDisplay();
    // Afficher le tableau des scores
    const scoresBoard = document.getElementById('scores-board');
    if (scoresBoard) {
        scoresBoard.classList.remove('hidden');
    }
} else {
    // Pas connecté: montrer écran de login
    console.log('Aucun user connecté, afficher login');
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });
    
    const loginScreen = document.getElementById('login-screen');
    loginScreen.classList.remove('hidden');
    loginScreen.style.display = 'flex';
    loginScreen.style.width = '100%';
    loginScreen.style.alignItems = 'center';
    loginScreen.style.justifyContent = 'center';
    loginScreen.style.flexDirection = 'column';
    
    // Cacher le tableau des scores
    const scoresBoard = document.getElementById('scores-board');
    if (scoresBoard) {
        scoresBoard.classList.add('hidden');
    }
}

// Navigation vers le menu principal après inscription réussie
function goToMainMenu() {
    // Masquer tous les écrans de connexion
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    
    // Afficher le menu
    document.getElementById('main-menu').classList.remove('hidden');
    
    // Afficher le profil (le tableau des scores ne doit apparaître qu'en Quiz)
    displayUserProfile();
    document.getElementById('user-profile-card').classList.remove('hidden');
    document.getElementById('scores-board').classList.add('hidden');
    
    // Réinitialiser les formulaires
    document.getElementById('signup-form').reset();
    document.getElementById('login-form').reset();
    
    // Masquer la case de succès
    document.getElementById('signup-success-message').classList.add('hidden');
}

// Afficher le modal de confirmation de déconnexion
function showLogoutConfirm() {
    document.getElementById('logout-overlay').classList.remove('hidden');
    document.getElementById('logout-confirm-message').classList.remove('hidden');
}

// Confirmer la déconnexion
function confirmLogout() {
    logoutUser();
}

// Annuler la déconnexion
function cancelLogout() {
    document.getElementById('logout-overlay').classList.add('hidden');
    document.getElementById('logout-confirm-message').classList.add('hidden');
}