angular.module('starter.controllers', ['ionic', 'ngCordova', 'firebase'])

.controller('DashCtrl', function($scope, $firebaseObject, $firebaseArray, $ionicLoading) {
    

})

// SaisieCtrl, contrôleur qui pourrait être divisé en plusieurs parties éventuellement
// Gère toute la saisie d'une journée
.controller('SaisieCtrl', 
["$ionicPlatform", "$scope", "$ionicModal", "$ionicPopup", "$timeout", "DatabaseManager", "$filter", "$ionicLoading", 
"$ionicScrollDelegate", "$location", function($ionicPlatform, $scope, $ionicModal, $ionicPopup, $timeout, Manager, $filter, 
$ionicLoading, $ionicScrollDelegate, $location) {

$ionicLoading.show({
    template: "Chargement du jour..."
}).then(function(){
    console.log("Loading");
    $scope.isAllowed = Manager.isAllowed();  
    if($scope.isAllowed != true){
        $ionicLoading.hide();
    }
});

$scope.scrollMe = function(anchor) {  
    $location.hash(anchor);

    $ionicScrollDelegate.anchorScroll();
};


$ionicPlatform.ready(function() {
    

    // en attendant que Manager fasse son boulot, on initialise tout
    // les valeurs sont remplacées s'il y a des données 
    function quicksave_init(){ 
        $scope.activite = {
            tache: "Lancement",
            categorie: "Choisissez votre activité",
            debut: new Date()
        }; // contient les infos sur l'activité en cours
        $scope.nb_eclairs = 0; // nombre d'interruptions dites "éclair" pour l'activité en cours
        $scope.en_pause = false; // mettre à true par défaut ?
        $scope.debut_pause = 0; // heure de début d'une pause
        $scope.en_deplacement = false; // si on est en déplacement ou pas
        $scope.debut_deplacement = 0; // heure de début d'un déplacement
        $scope.saisie = false;
        $scope.saisieFinie = false; 
        $scope.jour = 0;
        $scope.note = { text : "" }
        $scope.demo = Manager.demo;
    }

    quicksave_clear = function(){
        var items = ["quicksave", "note", "activite", "nb_eclairs", "en_pause", "debut_pause", "en_deplacement", "debut_deplacement", "jour"]; 
        items.forEach(function(element) {
            localStorage.removeItem(element);      
        }, this);
        quicksave_init();

    }

    quicksave_init();

// $scope.Manager = Manager; 


$scope.activer = function(key){
    Manager.connection(key).then(function(response){
            if(response.data == 1){
                $ionicPopup.alert({
                        title: 'Activation',
                        template: "L'application n'a pas pu être activée car la clé entrée n'existe pas."
                    });
                    document.location.href = 'index.html';
                    return -1;
                } else if(response.data == 2){
                    $ionicPopup.alert({
                        title: 'Activation',
                        template: "La clé que vous avez entrée est déjà utilisée par un autre utilisateur. Veuillez en entrer une autre ou nous contacter."
                    });
                    document.location.href = 'index.html';
                    return -2;
                } else {
                    $ionicPopup.alert({
                        title: 'Activation',
                        template: "L'application BlueTIME a été activée avec succès ! Vous pouvez désormais procéder au test"
                    });
                    
                    localStorage.setItem("key", key);
                    console.log(response.data);
                    Manager.changeRef(response.data);
                    Manager.allow = true;
                    Manager.init();
                    Manager.setDemo("YES");
                    document.location.href = 'index.html';
                    return 0;
                }
        });
       
 }


$scope.$watch('isAllowed', function (newValue) {
if(newValue == true){  
    Manager.askDay().then(function(data){
        if(!data){
            console.log("Aucun jour");
            /*var nouveau = Manager.createDay();
            console.log("Jour en cours", data);
            $scope.jour = nouveau.date; */

        } else {
            console.log("Il y a un jour");
            console.log("Jour en cours", data);
            $scope.jour = data.date;
            $scope.demo = data.demo; 
            // Avoir le jour d'aujourd'hui
            var now = new Date(); 
            var time = now.getDate() + "/" + (now.getMonth()+1);
            console.log(time);

            if(time == data.date) { 
                // Si le dernier jour est celui d'aujourd'hui 
                
                if(data.statut == 0){
                    console.log("Poursuite de la journée en cours");
                    $scope.saisie = true; 
                   
                } else if(data.demo == "YES") { // Si le dernier jour validé est une démo 
                    quicksave_clear(); // On fait comme si c'était un autre jour 
                } else {
                     console.log("Une journée a déjà été validée aujourd'hui");
                    quicksave_clear(); 
                     $scope.saisieFinie = true; 
                }
                
            } else {
                
                console.log("La dernière journée recensée n'a pas la date du jour");
                
                quicksave_clear(); 
            }
            
        }
        $ionicLoading.hide();
    });

    } 
});
    
 $scope.$watch('saisie', function (newValue) {
if(newValue == true){
    
    // INITIALISATION DES VARIABLES
    // CHAQUE CREATION DE NOUVELLE VARIABLE DOIT ETRE ANNONCEE ICI
    // AFIN D'AVOIR UN INVENTAIRE PRECIS
    $scope.choix = {};
    $scope.choix.interruptions = ["Telephone", "Sms/mail", "Bruit/environnement/pensée", "Urgence", "Recevoir un client", "Recevoir collaborateur",
"Aider quelqu’un", "Autre"]; 
    // contient les raisons possibles d'interruptions
    $scope.interr = {};
    $scope.taches = {}; // variable globale qui contient la liste de toutes les tâches possibles
    $scope.categories = {}; // variable "globale" qui contient la liste de toutes les catégories
    
    
    if(localStorage.getItem('quicksave') ){
        $scope.activite = JSON.parse(localStorage.getItem('activite')); // contient les infos sur l'activité en cours
        $scope.nb_eclairs = localStorage.getItem('nb_eclairs');
        $scope.en_pause = localStorage.getItem('en_pause').substr(2) == 'true' ? true : false; // mettre à true par défaut ?
        $scope.debut_pause = localStorage.getItem('debut_pause'); // heure de début d'une pause
        $scope.en_deplacement = localStorage.getItem('en_deplacement').substr(2) == 'true' ? true : false; // si on est en déplacement ou pas
        $scope.debut_deplacement = localStorage.getItem('debut_deplacement'); // heure de début d'un déplacement
        $scope.note.text = localStorage.getItem("note");
        // le jour n'est pas récupéré car il est déjà donné en haut
    }  
    
    /*
    gestion d'une "quicksave" => sauvegarde là où on en était même si on ferme l'application
    en sauvegardant toutes les variables dans une table à une certaine fréquence (toutes les minutes ? 5 min ?)
    Si l'utilisateur arrive, on doit pouvoir détecter s'il a déjà une journée en cours (effacement de la journée ou 
    reprise de la "quicksave" dans ce cas) ou non.
    */
    var quicksave = function(){
        console.log("Sauvegarde automatique !");
        localStorage.setItem('quicksave', true);
        
        localStorage.setItem('activite', JSON.stringify($scope.activite));
        localStorage.setItem('nb_eclairs', $scope.nb_eclairs);
        localStorage.setItem('en_pause', 'f '+$scope.en_pause);
        localStorage.setItem('debut_pause', $scope.debut_pause);
        localStorage.setItem('en_deplacement', 'f '+$scope.en_deplacement);
        localStorage.setItem('debut_deplacement', $scope.debut_deplacement);
        localStorage.setItem('jour', $scope.jour);
        localStorage.setItem('note', $scope.note);
        
        if($scope.saisie == true){
            $timeout(quicksave, 60000);
        }
    }
    
    $timeout(quicksave, 60000);
    
    /**
    * Affiche l'heure en temps réel dans $scope.clock; 
    */
    $scope.tickInterval = 1000 //ms
    var tick = function() {
        $scope.clock = Date.now() // get the current time
        $timeout(tick, $scope.tickInterval); // reset the timer
    }
    // Start the timer
    $timeout(tick, $scope.tickInterval);
    
    // Met à jour la liste totale des taches et catégories
    $scope.update = function (value){
                
        if(value == "taches"){
          $scope.taches = Manager.getTasks();
        
        } else if(value == "categories"){
          $scope.categories = Manager.getCategories();
           
        }
     
    }
    // Et bien sûr, on fait le remplissage initial ! 
    $scope.update('categories');
    $scope.update('taches');
    
    // Rajoute une tache ou une catégorie (bientôt plus ?) à la base de données
    $scope.create = function(type, value){
        if(type == 'tache') {
            Manager.createTask(value);
             $scope.update('taches');
        }
        if(type == 'categorie'){
            Manager.createCategory(value);
            $scope.update('categories');
        }
    }

    // Augmente le nombre d'interruptions éclairs
  $scope.eclair = function(){
    $scope.nb_eclairs++;   
  }
     
  // Modal pour l'interruption
  $ionicModal.fromTemplateUrl('templates/modal/interruption.html', {
     scope: $scope,
     animation: 'slide-in-up'
  }).then(function(modal) {
      $scope.interruptionModal = modal;
      $scope.interruptionModal.open = function(){
        $scope.interr_click = $scope.clock; 
        $scope.interruptionModal.show();
    }
  });

   $ionicModal.fromTemplateUrl('templates/modal/note.html', {
     scope: $scope,
     animation: 'slide-in-up'
  }).then(function(modal) {
      $scope.noteModal = modal;
      $scope.noteModal.open = function(){ 
        $scope.noteModal.show();
    }
  });

   
    
    // Fonction pour créer une interruption dans la BDD, déclenchée si on a validé
    $scope.interruption = function(i, debut, fin){
        i.heure_debut = debut;
        i.heure_fin = fin; 
        console.log(i);
            Manager.record({
                activite: i.cause,
                nature: "INTERRUPTION",
                tampon_debut: i.heure_debut,
                tampon_fin: i.heure_fin,
                jour: $scope.jour,
                note: $scope.note
            });
        $scope.interruptionModal.hide(); 

    }
    
     $scope.$watch('interr.heure_debut', function (newValue) {
        $scope.interr_click = $filter('date')(newValue, 'HH:mm:ss'); 
        //$scope.interr_click = newValue; 
        });
        
    $scope.$watch('interr_click', function (newValue) {
    $scope.interr.heure_debut = $filter('date')(newValue, 'HH:mm:ss'); 
    // $scope.interr.heure_debut = newValue; 
    });
    
    
    // Gestion de la pause
    
    $scope.pause = function(){
        if($scope.en_pause == false){
            $scope.en_pause = true;
            $scope.debut_pause = $scope.clock; 
        } else if($scope.en_pause == true){
            Manager.record({
                activite: "Pause",
                nature: "PAUSE",
                tampon_debut: $scope.debut_pause,
                tampon_fin: $scope.clock,
                jour: $scope.jour,
                note: $scope.note
            });
            $scope.en_pause = false; 
        }
    }
    
    // Gestion du déplacement 
    $scope.deplacement = function(){
        console.log("en déplacement");
        if($scope.en_deplacement == false){ 
            // On initie le déplacement 
            $scope.en_deplacement = true;
            $scope.debut_deplacement = $scope.clock; 
        } else {
            // On termine un déplacement
            Manager.record({
                activite: "Déplacement",
                nature: "DEPLACEMENT",
                tampon_debut: $scope.debut_deplacement,
                tampon_fin: $scope.clock,
                jour: $scope.jour,
                note: $scope.note
            });
            $scope.note.text = "";
            $scope.en_deplacement = false;
            activiteFin();
            $scope.activiteModal.show();
        }
    }
    
    
    
    // Modal pour aller sur  une nouvelle activité
    $ionicModal.fromTemplateUrl('templates/modal/activite.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.activiteModal = modal;
            if($scope.activite.nature = "") $scope.activiteModal.show();
        
    });

    var activiteFin = function(){
        Manager.record({
                activite: $scope.activite.tache,
                categorie: $scope.activite.categorie,
                nature: "TACHE",
                nb_eclairs: $scope.nb_eclairs,
                tampon_debut: $scope.activite.debut,
                tampon_fin: $scope.clock,
                jour: $scope.jour,
                note: $scope.note
            });   
            $scope.note.text = "";
        
    }
    
    // Changement d'activité
    $scope.activiteChange = function(val){ // val donne les infos sur la nouvelle activité : nom, catégorie..
        if($scope.activite.tache != "Lancement"){ // si c'est pas la première activité depuis qu'on démarre l'appli
            // On enregistre l'activité précédente dans la BDD
            activiteFin(); 
            quicksave();
        }
    
        $scope.activiteModal.hide();
        $scope.activite = val; // on change les valeurs sur l'activité en cours
        $scope.activite.debut = $scope.clock; // fixer à maintenant le début de l'activité
        $scope.nb_eclairs = 0; // réinitialiser le nombre d'interruptions éclairs
        $scope.note.text = " ";
    

        if($scope.en_pause) // si on était en pause, on enregistre la pause
            $scope.pause();
        
    } // fin de activiteChange(); !
    
    
    $scope.finJournee = function(){
        var confirmPopup = $ionicPopup.confirm({
        title: 'Fin de la journée',
        template: 'Vous ne pourrez plus enregistrer de tâches pour aujourd\'hui. Êtes-vous sûr ?',
        buttons: [{ // Array[Object] (optional). Buttons to place in the popup footer.
        text: 'Annuler',
        type: 'button-default',
        
        }, {
        text: 'Confirmer',
        type: 'button-positive',
        onTap: function(e) {
        // Returning a value will cause the promise to resolve with the given value.
        return e; }
    }
    ]}).then(function(res) {
        console.log(res);
        if(res) {
            $scope.saisie = false; 
            Manager.endDay().then(function(data){
                if(data.demo != "YES") $scope.saisieFinie = true; 
            });
            // il faut finir toute pause ou déplacement en cours 
            if($scope.en_deplacement) $scope.deplacement(); 
            if($scope.en_pause) $scope.pause(); 
            // finir l'activité aussi
            activiteFin();
         // $scope.send in options  
            if(!localStorage.getItem("key")) return false; 
            Manager.send(localStorage.getItem("key")); 
            $ionicPopup.alert({
                title: 'Mise à jour',
                template: 'Les données ont été envoyées sur votre profil BlueTIME. Veuillez vous y connecter pour vérifier que les nouvelles journées ont bien été ajoutées (cela peut échouer en cas d\'absence de connexion internet)'
            });
            
    
    }
    
    });
    }
    
    $ionicLoading.hide();
} // fin de if(newValue)
     else {
         $scope.debutJournee = function(){
             $ionicLoading.show({
                template: 'Création du jour',
                }).then(function(){
                    console.log("The loading indicator is now displayed");
                    quicksave_clear();
                    $scope.saisie = true; 
                    var j = Manager.createDay()
                    $scope.jour = j.date;
                    $scope.demo = j.demo;   
                });
			
        }
    }
 }); // fin du watch sur saisie
    
}); // fin de ionic platform ready
}]) // FIN DU CONTROLLEUR

.controller('TravailCtrl', ["$scope", "$ionicModal", "$ionicPopup", "DatabaseManager", "$filter", "$ionicLoading", function($scope, $ionicModal, $ionicPopup, Manager, $filter, $ionicLoading) {

$ionicLoading.show({
    template: 'Chargement du jour...' 
}).then(function(){
    console.log("Loading....");
    $scope.isAllowed = Manager.isAllowed();  
    if(!$scope.isAllowed) $ionicLoading.hide(); 
});

//$scope.isAllowed = Manager.isAllowed();  
$scope.Manager = Manager; 
$scope.activer = function(key){
    Manager.connection(key).then(function(response){
        if(response.data == 1){
            $ionicPopup.alert({
                title: 'Activation',
                template: "L'application n'a pas pu être activée car la clé entrée n'existe pas."
            });
            document.location.href = 'index.html';
            return -1;
        } else if(response.data == 2){
            $ionicPopup.alert({
                title: 'Activation',
                template: "La clé que vous avez entrée est déjà utilisée par un autre utilisateur. Veuillez en entrer une autre ou nous contacter."
            });
            document.location.href = 'index.html';
            return -2;
        } else {
            $ionicPopup.alert({
                title: 'Activation',
                template: "L'application BlueTIME a été activée avec succès ! Vous pouvez désormais procéder au test"
            });
                    
            localStorage.setItem("key", key);
            console.log(response.data);
            Manager.changeRef(response.data);
            Manager.allow = true;
            Manager.setDemo("YES");
            document.location.href = 'index.html';
            Manager.init();
            return 0;
        }
    });
}

$scope.$watch('isAllowed', function (newValue) {
    if($scope.isAllowed){
        $scope.taches = {}; // variable globale qui contient la liste de toutes les tâches possibles
        $scope.categories = {}; // variable "globale" qui contient la liste de toutes les catégories
        $scope.update = function (value){
                    
            if(value == "taches"){
            $scope.taches = Manager.getTasks();
            
            } else if(value == "categories"){
            $scope.categories = Manager.getCategories();
            }
        
        }
        // Et bien sûr, on fait le remplissage initial ! 
        $scope.update('categories');
        $scope.update('taches');
        
        // Rajoute une tache ou une catégorie (bientôt plus ?) à la base de données
        $scope.create = function(type, value){
            if(type == 'tache') {
                Manager.createTask(value);
                $scope.update('taches');
            }
            if(type == 'categorie'){
                Manager.createCategory(value);
                $scope.update('categories');
            }
        }
        
        $scope.changeFav = function(obj, n, type){
            obj.est_fav = n;
            if(type == "categorie"){
                Manager.changeCategory(obj);
            } else {
                Manager.changeTask(obj);
            }
            
            //$scope.update("taches");
            
        }

        $scope.suppr = function(obj, type){
            if(type == "categorie"){
                Manager.removeCategory(obj);
            } else if(type="tache") {
                Manager.removeTask(obj);
            }
        }
        $ionicLoading.hide(); 
    } // fin du if 
    
}); // fin du watch sur allow
	
}])
		

.controller('OptionsCtrl', ["$scope", "$ionicModal", "DatabaseManager", "$cordovaNetwork", "$ionicPopup", function($scope, $ionicModal, Manager, $cordovaNetwork, $ionicPopup) {



$scope.isAllowed = Manager.isAllowed();  
$scope.activer = function(key){
    Manager.connection(key).then(function(response){
        if(response.data == 1){
            $ionicPopup.alert({
                title: 'Activation',
                template: "L'application n'a pas pu être activée car la clé entrée n'existe pas."
            });
            document.location.href = 'index.html';
            return -1;
        } else if(response.data == 2){
            $ionicPopup.alert({
                title: 'Activation',
                template: "La clé que vous avez entrée est déjà utilisée par un autre utilisateur. Veuillez en entrer une autre ou nous contacter."
            });
            document.location.href = 'index.html';
            return -2;
        } else {
            $ionicPopup.alert({
                title: 'Activation',
                template: "L'application BlueTIME a été activée avec succès ! Vous pouvez désormais procéder au test"
            });
            
            localStorage.setItem("key", key);
            console.log(response.data);
            Manager.changeRef(response.data);
            Manager.allow = true;
            Manager.setDemo("YES");
            document.location.href = 'index.html';
            Manager.init();
            
            return 0;
                }
        });
}

$scope.$watch('isAllowed', function (newValue) {
    if(!$scope.isAllowed) return false;

    if(Manager.demo != "YES"){
        Manager.setDemo("NO");
    }
    
    $scope.switch = function(){
        Manager.changeDemo(); 
    }

    $scope.manager = Manager; 

    $scope.unlink = function(){
        localStorage.removeItem('key');
        document.location.href = 'index.html';
    }

    $scope.send = function(){
        if(!localStorage.getItem("key")) return false; 
        Manager.send(localStorage.getItem("key")); 
        $ionicPopup.alert({
     title: 'Mise à jour',
     template: 'Les données ont été envoyées sur votre profil BlueTIME. Veuillez vous y connecter pour vérifier que les nouvelles journées ont bien été ajoutées (cela peut échouer en cas d\'absence de connexion internet)'
   });
    }

    $scope.demo_auth = true; 

     Manager.askDay().then(function(data){
         console.log(data);
        if(data){
            // Avoir le jour d'aujourd'hui
            var now = new Date(); 
            var time = now.getDate() + "/" + (now.getMonth()+1);

            if(time == data.date && data.demo != "YES") { 
                // Si le dernier jour est celui d'aujourd'hui
                // Et qu'il n'est pas un jour de demo
                $scope.demo_auth = false; 
            }
                
        }
        
    });

 });


    
    
 }])



  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});


