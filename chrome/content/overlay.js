/*
 * namespace.
 */
if ("undefined" == typeof(AT)) {
  var AT = {};
};

/*
 * Start the ArtikelTrainer bookmarklet
 */
AT.Bookmarklet = {
	initialized:  false,
	enabledPages: [],
	
    ToggleBookmarklet : function() {
        var allsuspects = content.document.getElementsByTagName('script');
    	
		var isATOn = gBrowser.selectedTab.getAttribute("is-artikeltrainer-on");
		if (!!isATOn && isATOn == "true") {
			gBrowser.selectedTab.setAttribute("is-artikeltrainer-on", false);
			
			var btn = document.getElementById('at-button');
			btn.className = btn.className.replace(/\bartikeltrainer-win-button-checked\b/,'artikeltrainer-win-button-unchecked');
			var checkAnsItem = document.getElementById('cmd_at_check_answers');
			checkAnsItem.setAttribute("disabled", "true");
			AT.Main.dequizzify();	
		}else {
			gBrowser.selectedTab.setAttribute("is-artikeltrainer-on", true);
			
			var btn = document.getElementById('at-button');
			btn.className = btn.className.replace(/\bartikeltrainer-win-button-unchecked\b/,'artikeltrainer-win-button-checked');
			var checkAnsItem = document.getElementById('cmd_at_check_answers');
			checkAnsItem.setAttribute("disabled", "false");
		
			AT.Main.quizzify(content.document.body);
		}
    }
	
};

/*
 * Main methods of the extension
 */
 
AT.Main = {
	selEnabled: [],
	
	/*
	 * remove the drop-down lists from the content page and bring back to original state
	 */
	dequizzify: function() {
		console.log('dequizzify');
		
		var selSpans = content.document.getElementsByClassName('artikeltrainer_wrap');
		
		while(selSpans.length > 0){
			var sel = selSpans[0].getElementsByClassName('artikel_dropdown');
			if (!!sel) 
				while (sel.length > 0) {
					selSpans[0].removeChild(sel[0]);
				}
			var tn = content.document.createTextNode(selSpans[0].textContent);
			
			
			selSpans[0].parentNode.replaceChild(tn, selSpans[0]);
		}
		
	},
	
	/*
	 * Check the selected answers and alert user of results
	 */
	checkAnswers: function(event) {
		// alert('check Answers');
		var selSpans = content.document.getElementsByClassName('artikeltrainer_wrap');
		var correct = 0;
		var answered = 0;
		var all = 0;
		
		for(var i=0; i<selSpans.length; i++){
			var sel = selSpans[i].getElementsByClassName('artikel_dropdown');
			if (!!sel) 
				for (var j=0; j<sel.length; j++) {
					var correctAnsElem = sel[j].nextSibling;
					var ans = sel[j].value;
					
					all++;
					// sel[j].className = sel[j].className.replace(/\banswer_\w+\b/,'');
					if (ans.toLowerCase() == correctAnsElem.textContent.toLowerCase()) {
						//correct answer
						correct++;
						answered++;
						//decorate the selection element
						// sel[j].className += ' answer_correct';
						sel[j].setAttribute('style', "outline: 3px solid green;");
					} else if (ans != '-') {
						//wrong answer
						answered++;
						// sel[j].className += ' answer_wrong';
						sel[j].setAttribute('style', "outline: 3px solid red;");
					}
					
				}
			
		}
		
		var wrong = answered-correct;
		alert('Correct: '  + correct + '. Wrong: ' + wrong + '. Out of: ' + all + '.');
		
	},
	
	/*
	 * Convert the article words in a dropdown list box. Traverese all text node
	 */
	quizzify: function(element) {
		var text= [];
		for (var i= 0, n= element.childNodes.length; i<n; i++) {
			var child = element.childNodes[i];
			if (child.nodeType===1) {
				if (child.tagName.toLowerCase()!=='script' && child.tagName.toLowerCase()!=='select')
					AT.Main.quizzify(child);
			}
			else if (child.nodeType===3){ //It's a text node, check for article words
				// console.log(child.data);
				//find matching strings
				AT.Main.quizzifyText(child);
			}
		}
		return text.join('');
	},
	
	/*
	 * Process the text node
	 */
	quizzifyText: function(textElement) {
		// console.log('quizzify');
		
		searchArray = ["der ","das ","die ","dem ","den ","des "]; //searchText.split(" ");
		var highlightStartTag = "<select class=\"artikel_dropdown\">" +
										"<option value=\"-\">-<\/option>" +
										"<option value=\"der\">der<\/option>" +
										"<option value=\"die\">die<\/option>" +
										"<option value=\"das\">das<\/option>" +
										"<option value=\"den\">den<\/option>" +
										"<option value=\"dem\">dem<\/option>" +
										"<option value=\"des\">des<\/option>" +
								"<\/select>";
		highlightStartTag +=	"<span style=\"display:none;\" class=\"at_original_artikel\">";  
		// console.log(highlightStartTag);
		
		var highlightEndTag = '<\/span>';
		var text = textElement.textContent;
		
		//use regex
		var newText = text.replace(/\b(der|die|das|den|dem|des)\b/gi, highlightStartTag + "$&" + highlightEndTag);
		
		if (newText != text){
			// var elementToAppend = content.document.createElement('span');
			// elementToAppend.setAttribute('class','artikeltrainer_wrap');
			// elementToAppend.innerHTML = newText;
			// elementToAppend = elementToAppend.cloneNode(true); //clone node to domify the the html in text
			
			var elementAsString = "<span class=\"artikeltrainer_wrap\">" + newText + "<\/span>";
			var oParser = new DOMParser();
			try {
				var oDOM = oParser.parseFromString(elementAsString, "text/html"); //"text/html"works in FF12+
				textElement.parentNode.replaceChild(oDOM.getElementsByTagName("body")[0].firstChild, textElement);
			} catch (ex) {
				// print the name of the root element or error message
				dump(oDOM.documentElement.nodeName == "parsererror" ? "error while parsing" : oDOM.documentElement.nodeName);
				dump(ex);
			}
			
		}
		return true;
			
	},
	

	/*
	 * adjust the AT in when tab changes. Display selected icon only if quiziffy was clicked for the current page
	 */
	tabChangeListener: function(event) {
		// var lp = gBrowser.selectedTab.linkedPanel;
		var btn = document.getElementById('at-button');
		var checkAnsItem = document.getElementById('cmd_at_check_answers');
		var isATOn = gBrowser.selectedTab.getAttribute("is-artikeltreiner-on");
		
		 // alert('tab change');
		if (!!isATOn && isATOn == "true") {
			//trainer enabled on current page
			btn.checked = true;
			btn.className = btn.className.replace(/\bartikeltrainer-win-button-unchecked\b/,'artikeltrainer-win-button-checked');
			checkAnsItem.setAttribute("disabled", "false");
		}else {
			btn.checked = false;
			btn.className = btn.className.replace(/\bartikeltrainer-win-button-checked\b/,'artikeltrainer-win-button-unchecked');
			checkAnsItem.setAttribute("disabled", "true");
		}
		
	},

	/*
	 * adjust the AT in when tab changes. Display selected icon only if quiziffy was clicked for the current page
	 */	
	contentChangeListener: function(event) {
		var btn = document.getElementById('at-button');
		var checkAnsItem = document.getElementById('cmd_at_check_answers');
	
		if (event.target == content.document) {
			
			btn.checked = false;
			btn.className = btn.className.replace(/\bartikeltrainer-win-button-checked\b/,'artikeltrainer-win-button-unchecked');
			checkAnsItem.setAttribute("disabled", "true");
			
		}
	}
};


AT.button_added = "extensions.artikeltrainer.add.button.to.toolbar";
/*
 * Add icon to Toolbar
 */
AT.Button = {
    AddButtonToToolbarPalette : function() {

        try {
          var button = document.getElementById('at-button');
          var platformCode = "win";
          
          //var platformCode = navigator.platform.indexOf("Mac")!=-1 ? "mac" : "win";
          if (navigator.platform.indexOf("Mac") != -1) {
              platformCode = "mac";
          } else if (navigator.platform.indexOf("Linux") != -1) {
              platformCode = "linux";
          }

          var browserVersionCode = "";
          try {
            var browserVersion = new RegExp("Firefox/(\\d+)\\.","i").exec(navigator.userAgent)[1];
            browserVersionCode = browserVersion=="4" ? "-f4" : "";
          } catch(e) {
            // Exception here means that something went wrong and we use default button
          }

          // var butclass = "toolbarbutton-1 chromeclass-toolbar-additional " + platformCode + browserVersionCode + "-button";
          var butclass = "artikeltrainer-" + platformCode + browserVersionCode + "-button-unchecked";
          button.class = butclass;
          button.setAttribute('class', butclass);
          // button.setAttribute('id', butclass);
        } catch(ex) {
        //Nothing to do here. If something went wrong (like can't define navigator.appVersion when using VM) 
        //just skip customizing button.
        }

        var preferences = Components.classes["@mozilla.org/preferences;1"]
							.getService(Components.interfaces.nsIPrefService)
							.getBranch(null);
              
        try {
            if (false && preferences.getBoolPref(AT.button_added)) {
                return;
            }
        } catch(e) {
            //Do nothing
        }

        var toolbar = document.getElementById("nav-bar");
		
		var before = toolbar.firstChild;
		let elem = before = document.getElementById('search-container');
			if (elem && elem.parentNode == toolbar)
				before = elem.nextElementSibling;
		
		toolbar.insertItem('at-button', before);
		
        var currentSet = toolbar.getAttribute(toolbar.hasAttribute("currentset") ? "currentset" : "defaultset");
        var extendedSet = currentSet.indexOf("at-button")>=0?currentSet:currentSet.replace("search-container", "search-container,at-button");

		
		
        toolbar.setAttribute("currentset", extendedSet);
        toolbar.currentSet = extendedSet;
        document.persist("nav-bar", "currentset");
		
		try {
			BrowserToolboxCustomizeDone(true);
        }
		catch (e) { }

        preferences.setBoolPref(AT.button_added, true);
		
		
    }
};

window.addEventListener("load", function () {
	gBrowser.addEventListener("load", AT.Main.contentChangeListener, true)},
	false);
	window.addEventListener("load", AT.Button.AddButtonToToolbarPalette, false);
 gBrowser.tabContainer.addEventListener("TabSelect", function(e) { AT.Main.tabChangeListener(e); }, false);
