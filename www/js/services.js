angular.module('starter.services', ['firebase'])


/*
* Injecté dans les contrôleurs qui manipulent la BDD, soit un peu tous, le "Manager" permet de faire les requêtes dont on a besoin.
* Passer par une "factory", et donc un service, permet de rendre les contrôleurs et la gestion de la BDD assez indépendants, un peu
* comme dans le modèle MVC. 
* Il est envisageable de diviser ce service en plusieurs si on veut rendre ça plus propre, 
* ou de faire des surcouches qui "incorporent" le DatabaseManager et le DBA.
*/
.factory('DatabaseManager', function($ionicPlatform, $firebase, $firebaseArray, $http, $q){
    
    ref = firebase.database().ref();
    
    var manager = this;
    manager.ref = ref; 
    manager.allow = false; 
    manager.demo = localStorage.getItem("demo");

    manager.setDemo = function(val){
        localStorage.setItem("demo", val);
        manager.demo = localStorage.getItem("demo");
    }

    manager.createTask = function(name, ef){
        ef = ef || 0;
        // créer une nouvelle tâche dans la BDD
        ref.child('taches').push().set({
            nom: name,
            est_fav: ef
        	});
    }
    
    manager.getTasks = function(){
        return $firebaseArray(ref.child('taches'));
    }
	
	manager.changeTask = function(newval){
		ref.child("taches/"+newval['$id']).update({
			nom : newval.nom,
			est_fav : newval.est_fav
		});
		
	}
     manager.removeTask = function(obj){
		ref.child("taches/"+obj['$id']).remove();
	}

    manager.createCategory = function(name,  ef){
         ef = ef || 0;

        // créer une nouvelle catégorie dans la BDD   
        ref.child('categories').push().set({
            nom: name,
            est_fav: ef
        	});

    }
    
    manager.getCategories = function(){
        return $firebaseArray(ref.child('categories'));
    }
	
    manager.changeCategory = function(newval){
		ref.child("categories/"+newval['$id']).update({
			nom : newval.nom,
			est_fav : newval.est_fav
		});
	}

     manager.removeCategory = function(obj){
		ref.child("categories/"+obj['$id']).remove();
	}


    manager.dropTasks = function(){
        ref.child("taches").remove();
    }

     manager.dropCategories = function(){
        ref.child("categories").remove();
    }
    
    manager.connection = function(key){
       return $http({
            method: 'GET',
            url: 'http://analyse.bstime.fr/appli/key_activation.php?key='+key
            });
    }
    manager.send = function(key){
          return $http({
            method: 'GET',
            url: 'http://analyse.bstime.fr/appli/firebase.php?key='+key
            });
    }
    manager.changeRef = function(d){
          ref = ref.child(d);
          manager.ref = ref; 
         
    }

    manager.isAllowed = function(){

        if(manager.allow){
            return true;
        } else { 
            if(localStorage.getItem("key")){ // si on redécouvre qu'on est autorisé
                manager.changeRef(localStorage.getItem("key"));
                manager.allow = true; 
                return true; 
            } else return false;    
        }
    }

    manager.init = function(){
        if(!manager.isAllowed()) return -1;
        // Remplissage par défaut
    
    }

    manager.default = function(){
                
           var taches = [
               'Lecture', 'Rédaction', 'E-mail/sms/répondeur', 'Téléphone', 'Réunion d’équipe', 'Réunion informelle/discussion',
'Rencontre client/partenaire', 'Courier/signature', 'Vérification/suivi qualité/supervision logicielle', 'Gestion client', 'Achat/vente/négociation',
'Motivation', 'Recadrage', 'Médiation', 'Tournée relationnel/visite/réception', 'Paie', 'Facturation', 'Payer Factures', 'Accueil client/partenaire',
'Evaluation collaborateurs/carrière', 'Prestation/production/soin', 'Saisie diverse', 'Vérification matériel/stock', 'Autre', 'Aider quelqu’un'
           ];
           taches.forEach(function(element) {
               manager.createTask(element);
           }, this);

    }

    manager.defaultCategories = function(){
        var categories = ['Administratif/RH', 'Comptabilité/finance', 'Management/RH', 'Marketing', 'Organisation/pilotage/stratégie',
'Production/manutention/prestation', 'Formation', 'Relationnel', 'Divers'
]; 
        categories.forEach(function(element) {
               manager.createCategory(element);
           }, this);
    }

    
/*
    manager.createDay = function(date){
        // créer un nouveau jour 

        ref.child('jours').push().set({
            date: date,
            statut: 0,
            demo: manager.demo
        	});

    }*/
    
    // Met à jour le mode "démo" de la tablette 
    // Selon un argument ou switcher 
    manager.changeDemo = function(arg){
        var local = manager.demo; 
        if(!arg){
            if(!local || local == "NO"){
                var arg = "YES";
            } else {
                var arg = "NO";
            }
        }
        manager.setDemo(arg);
    }

    manager.record = function(r){ 
        // Enregistre une activité
        // nécessite un objet r(activite*, categorie, nature*, tampon_debut*, tampon_fin*, nb_eclairs, id_rattach, note, jour*)
        // peu importe l'ordre
       

        // remplacer par des valeurs nulles si on a pas renseigné les valeurs "facultatives"
        if(!r.note) r.note = {text: ""};
        if(!r.nb_eclairs) r.nb_eclairs = 0;
        if(!r.categorie) r.categorie = "";
       

        if(r.tampon_debut && r.tampon_fin && r.activite && r.jour && r.nature){
           
            if(r.nature == "INTERRUPTION"){
               
               // var hour = r.tampon_debut;
              //  r.tampon_debut = new Date();
               // r.tampon_debut.setHours(hour.substring(0, 2), hour.substring(3, 5));
               r.tampon_debut = r.tampon_debut.valueOf(); 
                                 
            }

            r.note = r.note.text; 

            var demo = localStorage.getItem("demo");
           /* if(demo == "YES"){
			    ref.child('records_demo').push().set(r);
            } else {*/
                ref.child('records').push().set(r);
           // }
			
           
            
        } else console.log('manager.record : Erreur, il manque des champs obligatoires. La fonction nécessite un objet r(activite*, categorie, nature*, tampon_debut*, tampon_fin*, nb_eclairs, id_rattach, note, jour*) où * signifie obligatoire.', r);
    }
    
 
    // Gestion des jours
    // statut : 
        // 0 - créé
        // 1 - terminé
        // 2 - complété ?
    manager.createDay = function(){
        var now = new Date();
        var time = now.getDate() +'/' +(now.getMonth()+1);
        var jour = {
            date: time,
            statut: 0,
            demo: manager.demo
        	};
        ref.child('jours').push().set(jour);
        return jour; 

    }
    
    manager.askDay = function(){  // va chercher la dernière journée 
        
       // var promise = DBA.query("SELECT * FROM jours ORDER BY id DESC LIMIT 1");
       return $q(function(resolve, reject) {
             ref.child('jours').limitToLast(1).once("value", function(snapshot) {
                   for (var first in snapshot.val()) break;
					if(first){
						var obj = snapshot.val()[first];
						obj.key = first; 
						 resolve(obj);
					} else resolve(false);
                
                  });
            });

        
       
    }
    
    manager.endDay = function(){
        return $q(function(resolve, reject){ 
            
            manager.askDay().then(function(data){ // jour { statut, date, demo }
                var first = data.key;
                ref.child('jours/'+first).update({
                    statut: 1
                });
                resolve(data);
            });

        });
 }

     
    manager.takeoverDay = function(){
        return $q(function(resolve, reject){ 
            
            manager.askDay().then(function(data){ // jour { statut, date, demo }
                var first = data.key;
                ref.child('jours/'+first).update({
                    statut: 0
                });
                resolve(data);
            });

        });
 }
    

    manager.getDaysByStatus = function(st){
        //return DBA.query("SELECT * FROM jours WHERE statut="+st);
		return new Promise(
           function(resolve, reject){
               //var jours = ref.child('jours').limitToLast(1));
               //co¤nsole.log(jours);
              // resolve(jours);
               ref.child('jours').startAt(st).endAt(st).once("value", function(snapshot) {
                   
                 resolve(snapshot.val());
                  });
           });

		   
    }
    
    
    manager.clear = function(){
        // nettoie la BDD   
        ref.child('jours').remove();
		ref.child('records').remove();
    }
    

    
    return manager; 
    
    
});


