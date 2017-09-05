(function () {
	window.addEventListener("tizenhwkey", function (ev) {
		var activePopup = null,
			page = null,
			pageid = "";

		if (ev.keyName === "back") {
			activePopup = document.querySelector(".ui-popup-active");
			page = document.getElementsByClassName("ui-page-active")[0];
			pageid = page ? page.id : "";

			if (pageid === "main" && !activePopup) {
				try {
					tizen.application.getCurrentApplication().exit();
				} catch (ignore) {
				}
			} else {
				window.history.back();
			}
		}
	});
	
	var renderWeight = function() {
		var weights = localStorage.getItem('weights');
		if (weights !== null) {
			weights = JSON.parse(weights);
			var currentWeightObj =  weights[weights.length - 1];
			var currentWeight = currentWeightObj.weight_kg; // weight in kilos
			currentWeight = convertKilogramToPounds(currentWeight);
			var documentWeight = document.querySelector("#weight-int");
			documentWeight.textContent = currentWeight.toFixed(1);
			
			var documentDate = document.querySelector("#days-ago");
			documentDate.textContent = convertDaysSinceEpochToAgo(currentWeightObj.date_int);
		}
		
	};
	
	var updateWeight = function() {
	    var documentLoading = document.querySelector("#main .cp-spinner");
	    documentLoading.classList.remove('hidden');
	    var httpRequest = new XMLHttpRequest();
	    httpRequest.onreadystatechange = function(){
	    	console.log('onreadystatechange');
	       if (httpRequest.status === 200) {
	    	   console.log('200');
	    	   var weights = JSON.parse(httpRequest.response);
	    	   var lastWeight = weights.month.day[0];
	    	   localStorage.setItem('weights', JSON.stringify(weights.month.day));
	    	   localStorage.setItem('weightsDate', new Date());
	    	   renderWeight();
	    	   documentLoading.classList.add('hidden');
	       }
	    };
	
	    httpRequest.open('GET', 'https://www.kyledornblaser.com/Fat-Secret/index.php?method=weights.get_month', true);
	    httpRequest.send();
	    
	}
	
	var convertDaysSinceEpochToAgo = function(daysSinceEpoch) {
		var now = new Date();
		var currentDaysSinceEpoch = Math.floor(now/8.64e7); // https://stackoverflow.com/questions/12739171/javascript-epoch-time-in-days/12739212#12739212
		var daysAgo = currentDaysSinceEpoch - daysSinceEpoch;
		if (daysAgo == 0) {
			return 'Today';
		} else if (daysAgo == 1) {
			return 'Yesterday';
		} else {
			return daysAgo + ' days ago';
		}
	}
	
	var convertKilogramToPounds = function(kilograms) {
		return kilograms * 2.20462262185;
	};
	
	var convertPoundsToKilograms = function(pounds) {
		return pounds / 2.20462262185;
	};
	
	var saveWeight = function(weight) {
		var weights = localStorage.getItem('weights');
		weights = JSON.parse(weights);
		// check if last weight was already added today
		var lastWeight =  weights[weights.length - 1];
		var lastWeightDate = lastWeight.date_int;
		var now = new Date();
		var currentDaysSinceEpoch = Math.floor(now/8.64e7);
		if (lastWeightDate === currentDaysSinceEpoch) {
			weights[weights.length - 1].weight_kg = weight;
			console.log('replace');
		} else {
			weights.push({date_int: currentDaysSinceEpoch, weight_kg: weight});
			console.log('add');
		}
		localStorage.setItem('weights', JSON.stringify(weights));
 	   	localStorage.setItem('weightsDate', new Date());
		
	};
	
	renderWeight();
	var hour = 1000 * 60 * 60;
	var updateTime = hour * 4; // update cached weights after this time
	var weights = localStorage.getItem('weights');
	var weightsDate = new Date(localStorage.getItem('weightsDate'));
	if (weights === null || (new Date() - weightsDate) > updateTime) {
		updateWeight();
	}
	
	var updateButton = document.getElementById('update-button');
	updateButton.addEventListener('click', function() {
    	 var documentUpdateWeight = document.querySelector("#update-weight-int");
    	 var documentDifference = document.querySelector("#difference");
    	 var weights = localStorage.getItem('weights');
    	 var currentWeight = 0;
    	 if (weights !== null) {
    		 weights = JSON.parse(weights);
    		currentWeight = convertKilogramToPounds(weights[weights.length - 1].weight_kg);
    	 }
    	 documentUpdateWeight.textContent = currentWeight.toFixed(1);
    	 documentDifference.textContent = 0.0;
        tau.changePage('#update');
    });
	
	var submitUpdateButton = document.getElementById('submit-update-button');
	submitUpdateButton.addEventListener('click', function() {
    	 var documentUpdateWeight = document.querySelector("#update-weight-int");
    	 var documentStatus = document.querySelector("#update .cp-spinner");
    	 var currentWeight = documentUpdateWeight.textContent;
    	 currentWeight = convertPoundsToKilograms(currentWeight);
    	 
    	 
    	 var httpRequest = new XMLHttpRequest();
 	    httpRequest.onreadystatechange = function(){
 	    	console.log('onreadystatechange');
 	       if (httpRequest.status === 200) {
 	    	   console.log('200');
 	    	  documentStatus.classList.add('hidden');
 	    	  saveWeight(currentWeight);
 	    	  renderWeight();
 	    	  window.history.back();
 	    	  
 	       }
 	    };
 	
 	    httpRequest.open('GET', 'https://www.kyledornblaser.com/Fat-Secret/index.php?method=weight.update&current_weight_kg=' + currentWeight, true);
 	    httpRequest.send();
 	    
 	    documentStatus.classList.remove('hidden');
 	    
    	 
    });
	
	
	document.addEventListener('rotarydetent', function(ev) {
		var pageUpdate = document.querySelector("#update");
		if (pageUpdate.classList.contains('ui-page-active')) {
		    var direction = ev.detail.direction;
		    var documentUpdateWeight = document.querySelector("#update-weight-int");
		    var documentDifference = document.querySelector("#difference");
		    var currentWeight = parseFloat(documentUpdateWeight.textContent);
		    
		    var weights = localStorage.getItem('weights');
	   	 	var oldWeight = 0;
	   	 		if (weights !== null) {
		   		weights = JSON.parse(weights);
		   		oldWeight = convertKilogramToPounds(weights[weights.length - 1].weight_kg);
		   	}
		    
		    
		    if (direction === 'CW') {
		    	currentWeight = currentWeight + 0.1;
		    } else {
		    	currentWeight = currentWeight - 0.1;
		    }
		    documentUpdateWeight.textContent = currentWeight.toFixed(1);
		    documentDifference.textContent = (currentWeight - oldWeight).toFixed(1);
		}
	});
	
}());