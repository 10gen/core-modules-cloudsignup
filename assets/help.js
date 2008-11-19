

function gitChoice( num ){
    for ( var i=1; i != 4; i++ ){ hideElement( "git_" + i ); }
    showElement( "git_" + num );
}

function checkSiteName( inp ){
    if ( ! inp.value || inp.value.length == 0 ) return;
    
    inp.value = inp.value.toLowerCase().replace( /[^a-z0-9\.\-]/g , "" )
    
    var res = loadDocSync( "/cloudSignup?action=checkSiteName&name=" + escape( inp.value ) );
    if ( res.match( /false/ ) ){
        window.alert( "site name [" + inp.value + "] is taken" );
        inp.value = "";
        inp.focus();
    }
    
}

function getRadioValue( radio ){
    for ( var i=0; i != radio.length; i++ ){
        if ( radio[i].checked ) return radio[i].value;
    }
}

function validateInformation( form ){

    if ( ! checkMinSize( form.name , 3  , "need to specify site name (min 3 characters)" ) ) return false;
    if ( ! checkMinSize( form.username , 6  , "need to specify valid username (min 6 characters)" ) ) return false;
    if ( ! checkMinSize( form.email , 3  , "need to specify valid email address" ) ) return false;
    if ( ! checkMinSize( form.pass1 , 6  , "need to specify valid password (min 6 characters)" ) ) return false;
    if ( ! checkMinSize( form.pass2 , 6  , "need to specify valid password (min 6 characters)" ) ) return false;
  
    if ( form.email.value.indexOf( "@" ) < 0 ){
        window.alert( "invalid email address" );
        return false;
    }
    
    if ( form.pass1.value != form.pass2.value ){
        window.alert( "passwords don't match" );
        return false;
    }

    var gitChoice = getRadioValue( form.git_choice );
    if ( ! gitChoice ){
        window.alert( "need to pick a git option" );
        return false;
    }
    
    if ( gitChoice == "new_github" ){
        if ( ! checkMinSize( form.github_new , 2 , "need to specify a new github account name" ) ) return false;
    }

    if ( gitChoice == "old_github" ){
        if ( ! checkMinSize( form.github_old , 2 , "need to specify an old github account name" ) ) return false;
        if ( ! checkMinSize( form.github_site , 2 , "need to specify a github site name" ) ) return false;
    }

    if ( gitChoice == "custom" ){
        if ( ! checkMinSize( form.giturl , 6 , "need to specify a git clone url" ) ) return false;
    }

    if ( ! form.agree.checked ){
        window.alert( "need to agree to terms of service" );
        return false;
    }

    return true;
}

function checkMinSize( inp , min , errorMsg ){
    if ( inp.value && inp.value.length >= min ) return true;
    window.alert( errorMsg );
    return false;
}

function loadHook( gitChoice ){
    var radio = getElement( "signup_form" );
    for ( var i=0; i != radio.length; i++ ){
        if ( radio[i].value == gitChoice ){
            radio[i].checked = true;
            return;
        }
    }
}
