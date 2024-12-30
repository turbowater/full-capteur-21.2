let chocs = 0;
let maxAngleX = -Infinity;
let minAngleX = Infinity;
let maxVario = -Infinity;
let minVario = Infinity;
let outOfRangeCount = 0;
let outOfRangeStartTime = null;
let outOfRangePausedTime = 0;
let isOutOfRange = false;
let lastAcc = { x: 0, y: 0, z: 0 }; // Stocke la dernière mesure d'accélération
let lastShockTime = 0;
const shockDelay = 200; // Délai de 200ms entre chaque choc
let customMinAngleX = -30;  // Valeur minimale personnalisée de l'angle
let customMaxAngleX = 30;   // Valeur maximale personnalisée de l'angle

// Variables pour le baromètre
let lastAltitude = null;
let lastTimestamp = null;
const seaLevelPressure = 1013.25; // Pression au niveau de la mer en hPa

// Fonction pour convertir la pression en altitude (approximatif)
function calculateAltitude(pressure) {
    return (1 - Math.pow(pressure / seaLevelPressure, 0.190284)) * 44330.77;
}

// Variable pour la force maximale des chocs
let maxForceChoc = 0; // Force maximale des chocs enregistrée durant la session

const masseSmartphone = 0.2; // Masse approximative du smartphone en kg (ajustez selon votre cas)

// Fonction pour calculer la force en Newton
function calculateForce(accTotal) {
    return masseSmartphone * accTotal; // F = m * a
}

// Fonction pour formater la durée en hh:mm:ss
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}


// Fonction pour valider les nouvelles limites de la plage d'angle
document.getElementById('validate-angle-range').addEventListener('click', () => {
    // Récupérer les valeurs entrées par l'utilisateur
    const minAngleInput = document.getElementById('angle-min').value;
    const maxAngleInput = document.getElementById('angle-max').value;

    // Vérifier que les valeurs sont valides (des nombres)
    if (!isNaN(minAngleInput) && !isNaN(maxAngleInput)) {
        customMinAngleX = parseFloat(minAngleInput);
        customMaxAngleX = parseFloat(maxAngleInput);

        // Afficher un message de confirmation
        alert(`Plage d'angle mise à jour : Min = ${customMinAngleX}° / Max = ${customMaxAngleX}°`);
    } else {
        alert("Veuillez entrer des valeurs valides pour l'angle.");
    }
});



// Mise à jour de la gestion de l'inclinaison avec les nouvelles limites personnalisées
window.addEventListener('deviceorientation', (event) => {
    const angleX = event.beta; // Inclinaison autour de l'axe X (beta)
    document.getElementById('angleX').textContent = angleX.toFixed(1);

    // Mise à jour des valeurs maximales et minimales
    if (angleX > maxAngleX) maxAngleX = angleX;
    if (angleX < minAngleX) minAngleX = angleX;

    // Vérification si l'angle sort de la plage personnalisée
    if (angleX < customMinAngleX || angleX > customMaxAngleX) {
        if (!isOutOfRange) {
            isOutOfRange = true;
            outOfRangeCount++;
            document.getElementById('sorties-plage').textContent = outOfRangeCount;
            outOfRangeStartTime = new Date(); // Démarre le chronomètre
        }
    } else {
        if (isOutOfRange) {
            isOutOfRange = false;
            outOfRangePausedTime += new Date() - outOfRangeStartTime;
            document.getElementById('duree-hors-plage').textContent = formatDuration(outOfRangePausedTime);
        }
    }

    // Mise à jour des statistiques
    document.getElementById('angleX-max').textContent = maxAngleX.toFixed(1);
    document.getElementById('angleX-min').textContent = minAngleX.toFixed(1);
});




// Gestion du capteur de mouvement (détection des chocs)
window.addEventListener('devicemotion', (event) => {
    const acc = event.acceleration;
    const accTotal = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);


    // Variation de l'accélération
    const deltaAccX = Math.abs(acc.x - lastAcc.x);
    const deltaAccY = Math.abs(acc.y - lastAcc.y);
    const deltaAccZ = Math.abs(acc.z - lastAcc.z);

    // Condition pour détecter un choc : accélération élevée ET variation rapide
    const isShock = accTotal > 8 && (deltaAccX > 8 || deltaAccY > 8 || deltaAccZ > 8);              // sensibilité des chocs

    if (isShock && Date.now() - lastShockTime > shockDelay) {
        chocs++;
        lastShockTime = Date.now();

        // Calcul de la force du choc
        const force = calculateForce(accTotal);

        // Mettre à jour la force maximale des chocs
        if (force > maxForceChoc) {
            maxForceChoc = force;
        }

        // Mise à jour des valeurs dans le tableau
        document.getElementById('chocs').textContent = chocs;
        document.getElementById('force-chocs').textContent = maxForceChoc.toFixed(2); // Affichage de la force maximale du choc en N
    }

    // Met à jour la dernière mesure
    lastAcc = { x: acc.x, y: acc.y, z: acc.z };
});


// Gestion du baromètre (variomètre basé sur la pression)
if ('Barometer' in window) {
    const sensor = new Barometer({ frequency: 10 }); // Lecture à 10 Hz
    sensor.onreading = () => {
        const currentPressure = sensor.pressure; // Pression en hPa
        const currentTimestamp = sensor.timestamp; // Temps en ms
        const currentAltitude = calculateAltitude(currentPressure);
        
        // Afficher la pression et l'altitude sur la page
 //       document.getElementById('pressure').textContent = `${currentPressure.toFixed(2)} hPa`;
        document.getElementById('altitude').textContent = `${currentAltitude.toFixed(2)} m`;

        if (lastAltitude !== null && lastTimestamp !== null) {
            // Calcul de la variation d'altitude (m/s)
            const deltaTime = (currentTimestamp - lastTimestamp) / 1000; // En secondes
            const deltaAltitude = currentAltitude - lastAltitude;
            const vario = deltaAltitude / deltaTime; // Variation en m/s

            // Mise à jour des statistiques
            if (vario > maxVario) maxVario = vario;
            if (vario < minVario) minVario = vario;

         //   document.getElementById('vario').textContent = vario.toFixed(2);          // affichage vario instantané
            document.getElementById('vario-max').textContent = maxVario.toFixed(2);
            document.getElementById('vario-min').textContent = minVario.toFixed(2);
        }

        // Mise à jour des valeurs actuelles
        lastAltitude = currentAltitude;
        lastTimestamp = currentTimestamp;
    };
    sensor.onerror = (event) => {
        console.error('Erreur du capteur barométrique :', event.error);
    };
    sensor.start();
} else {
    console.warn('Baromètre non pris en charge sur cet appareil.');
//    document.getElementById('vario').textContent = 'Non disponible';
}




// compte rotations

let cumulativeRotation = 0; // Rotation cumulée en degrés
let clockwiseRotations = 0; // Nombre de rotations complètes dans le sens horaire
let counterClockwiseRotations = 0; // Nombre de rotations complètes dans le sens antihoraire
let totalRotations = 0; // Total des rotations cumulées (positif + négatif)


// Vérifie si le capteur gyroscopique est disponible
if ('AbsoluteOrientationSensor' in window || 'Gyroscope' in window) {
    const sensor = new Gyroscope({ frequency: 60 });

    sensor.addEventListener("reading", () => {
        const rotationRateZ = sensor.z; // Rotation en rad/s
        const deltaTime = 1 / 60; // Intervalle de temps en secondes (fréquence de 60Hz)

        // Convertir la vitesse angulaire en degrés et ajouter à la rotation cumulée
        const deltaRotation = (rotationRateZ * 180 / Math.PI) * deltaTime;
        cumulativeRotation += deltaRotation;

        // Vérifie si une rotation complète est atteinte dans le sens horaire ou antihoraire
        if (cumulativeRotation >= 360) {
            const rotations = Math.floor(cumulativeRotation / 360); // Nombre de rotations complètes
            clockwiseRotations += rotations;
            totalRotations += rotations; // Mise à jour du total
            cumulativeRotation %= 360; // Réinitialiser la rotation cumulée
        } else if (cumulativeRotation <= -360) {
            const rotations = Math.floor(-cumulativeRotation / 360); // Nombre de rotations complètes
            counterClockwiseRotations += rotations;
            totalRotations += rotations; // Mise à jour du total
            cumulativeRotation %= 360; // Réinitialiser la rotation cumulée
        }

        // Met à jour l'affichage
            document.getElementById('totalRotations').textContent = totalRotations;

    });

    sensor.start();

} else {

    document.getElementById('totalRotations').textContent = "Non disponible";
}

// Date et heure

function getCurrentDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Mise à jour de la date et de l'heure au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const dateTimeElement = document.getElementById('date-time');
    dateTimeElement.textContent = getCurrentDateTime();
});


// Réinitialisation des valeurs
document.getElementById('reset-button').addEventListener('click', () => {

    // Sauvegarder les valeurs de la session actuelle dans le tableau de session précédente
    const prevSessionBody = document.getElementById('prev-session-body');

    // Récupérer la date et l'heure dans le tableau B
    const dateTimePreviousSession = document.getElementById('date-time').textContent;

    prevSessionBody.innerHTML = `
        <tr><td>Date et Heure</td><td>${dateTimePreviousSession}</td></tr>
        <tr><td>Angle X Max</td><td>${maxAngleX.toFixed(1)}</td></tr>
        <tr><td>Angle X Min</td><td>${minAngleX.toFixed(1)}</td></tr>
        <tr><td>Sorties de Plage (-30° à +30°)</td><td>${outOfRangeCount}</td></tr>
        <tr><td>Durée Hors Plage</td><td>${formatDuration(outOfRangePausedTime)}</td></tr>
        <tr><td>Variomètre Max</td><td>${maxVario.toFixed(2)}</td></tr>
        <tr><td>Variomètre Min</td><td>${minVario.toFixed(2)}</td></tr>
        <tr><td>Chocs</td><td>${chocs}</td></tr>
        <tr><td>Force chocs (N)</td><td>${maxForceChoc.toFixed(2)}</td></tr>
        <tr><td>Rotations</td><td>${totalRotations}</td></tr>
    `;

    // Réinitialisation des valeurs
    chocs = 0;
    maxForceChoc = 0;
    maxAngleX = -Infinity;
    minAngleX = Infinity;
    maxVario = -Infinity;
    minVario = Infinity;
    outOfRangeCount = 0;
    outOfRangePausedTime = 0;
    isOutOfRange = false;
    clockwiseRotations = 0;
    counterClockwiseRotations = 0;
    totalRotations = 0;
    cumulativeRotation = 0;

    // Réinitialiser le tableau de la session actuelle
    document.getElementById('chocs').textContent = '0';
    document.getElementById('angleX-max').textContent = '0';
    document.getElementById('angleX-min').textContent = '0';
    document.getElementById('sorties-plage').textContent = '0';
    document.getElementById('duree-hors-plage').textContent = '00:00:00';
    document.getElementById('vario-max').textContent = '0.00';
    document.getElementById('vario-min').textContent = '0.00';
    document.getElementById('totalRotations').textContent = '0';
    document.getElementById('force-chocs').textContent = '0.00';


    // Mise à jour de la date et de l'heure
    document.getElementById('date-time').textContent = getCurrentDateTime();
});

    
// Fonction pour générer et télécharger un fichier (CSV ou JSON)
function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Fonction pour convertir un tableau en format CSV avec point-virgule
function convertToCSV(data) {
    const rows = [];
    const headers = Object.keys(data[0]);
    rows.push(headers.join(';')); // Utilisation du point-virgule comme séparateur

    data.forEach(row => {
        rows.push(headers.map(header => row[header]).join(';')); // Utilisation du point-virgule comme séparateur
    });

    return rows.join('\n');
}

// // Fonction pour convertir un tableau en format JSON
// function convertToJSON(data) {
//     return JSON.stringify(data, null, 2);
// }

// Fonction pour obtenir les données du tableau B (Résumé de la Session)
function getTableauBData() {
    return [
        { Description: 'Angle X Max (°)', Valeur: document.getElementById('angleX-max').textContent },
        { Description: 'Angle X Min (°)', Valeur: document.getElementById('angleX-min').textContent },
        { Description: 'Sorties de Plage (-30° à +30°)', Valeur: document.getElementById('sorties-plage').textContent },
        { Description: 'Durée Hors Plage', Valeur: document.getElementById('duree-hors-plage').textContent },
        { Description: 'Variomètre Max (m/s)', Valeur: document.getElementById('vario-max').textContent },
        { Description: 'Variomètre Min (m/s)', Valeur: document.getElementById('vario-min').textContent },
        { Description: 'Chocs', Valeur: document.getElementById('chocs').textContent },
        { Description: 'Force chocs (N)', Valeur: document.getElementById('force-chocs').textContent },
        { Description: 'Rotations', Valeur: document.getElementById('totalRotations').textContent },
    ];
}

// Fonction pour obtenir les données du tableau C (Session Précédente)
function getTableauCData() {
    const rows = document.querySelectorAll('#prev-session-body tr');
    const data = [];
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length === 2) {
            data.push({ Description: cols[0].textContent, Valeur: cols[1].textContent });
        }
    });
    return data;
}

// Affichage de la modale de téléchargement
document.getElementById('download-button').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'block';
});

// Annuler le téléchargement
document.getElementById('cancel-download').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
});

// Confirmer le téléchargement
document.getElementById('confirm-download').addEventListener('click', () => {
    const dataChoice = document.getElementById('data-choice').value;
    const filename = document.getElementById('filename').value || 'data'; // Nom par défaut si vide

    let data;
    if (dataChoice === 'tableauB') {
        data = getTableauBData();
    } else {
        data = getTableauCData();
    }

    // Choisir le format de téléchargement (CSV ou JSON)
    const content = convertToCSV(data);  // Ou utilisez `convertToJSON(data)` pour JSON

    // Télécharger le fichier
    downloadFile(content, filename + '.csv'); // Changez en '.json' si nécessaire

    // Fermer la modale
    document.getElementById('modal').style.display = 'none';
});



             