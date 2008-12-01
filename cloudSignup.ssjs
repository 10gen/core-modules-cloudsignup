activePage = 'cloudSignup';

var theCloud = javaStatic( "ed.cloud.Cloud" , "getInstanceIfOnGrid" );
assert( theCloud , "no cloud environment available" );

if ( request.name ){
    request.name = request.name.toLowerCase();
    request.name = request.name.replace( /[^\w\-\.]/g , "" );
}


if ( "checkSiteName" == request.action ){
    var name = ( request.name || "" ).trim();
    if ( name.length == 0 ){
        print( "false\n" );
    }
    else {
        var theSite = theCloud.findSite( request.name , false );
        if ( theSite )
            print( "false\n" );
        else
            print( "true\n" );
    }
    return;
}

htmlheader('10gen | Cloud Sign-Up');

var data = {
    
    _when : new Date() ,
    
    giturl : request.giturl ,
    name : request.name ,
    username : request.username ,
    email : request.email ,
    email2 : request.email2 ,
    phone : request.phone ,

    git_choice : request.git_choice ,
    github_new : request.github_new ,
    github_old : request.github_old ,
    github_site : request.github_site ,

    externalDomain : javaStatic( "ed.util.Config" , "getExternalDomain" )
};

db.signupAttempts.save( data );

var haveErrors = false;
var step = "signup";

function myError( msg ){
    print( "<h2 style='color:red'>" + msg + "</h2>" );
    haveErrors = true;
}

function validateGit(){
    
    if ( request.git_choice == "new_github" ){
        if ( ! request.github_new ){
            myError( "need to specify new github account name" );
        }
        else if ( data.name ){
            try {
                var g = javaCreate( "ed.git.Github" );
                var ident = g.createAccount( request.github_new , data.email , request.pass1 );
                g.forkRepository( ident , "10gen/template-github-hello-world" );
                g.renameRepository( ident , "template-github-hello-world" , data.name );
                data.giturl = "git://github.com/" + request.github_new + "/" + data.name;

                // switch to "old" mode so if this succeeds but the whole signup fails, we can reuse this account
                data.git_choice = "old_github";
                data.github_old = data.github_new;
                data.github_site = data.name;

                sleep( 1000 ); // give the git people some time to get ready
            }
            catch ( e ){
                myError( e );
            }
        }
    }
    else if ( request.git_choice == "old_github" ){
        if ( request.github_private )
            data.giturl = "git@github.com:" + request.github_old + "/" + request.github_site + ".git";
        else
            data.giturl = "git://github.com/" + request.github_old + "/" + request.github_site + ".git";
    }
    else if ( request.git_choice == "custom" ){
    }
    else {
        myError( "need to choose a git method" );
    }
    
    if ( data.giturl ){
        var root = "/tmp/git-temp/" + md5( data.giturl );
        var rootFile = javaCreate( "java.io.File" , root );
        rootFile.mkdirs();
        if ( javaStatic( "ed.util.GitUtils" , "clone" , data.giturl , rootFile  , "temp" ) ){
            javaStatic( "ed.io.FileUtil" , "deleteDirectory" , rootFile );
        }
        else {
            myError( "couldn't clone giturl from [" + data.giturl + "]" );
        }
    }
    else {
        myError( "need to specify a giturl" );
    }
}

function validateAccount(){
    if ( ! data.name )
        myError( "need to specify site name" );
    if ( theCloud.findSite( data.name , false ) )
        myError( "site [" + data.name + "] taken" );
    
    if ( ! data.username || data.username.length < 6 )
        myError( "need a valid username" );
    
    if ( ! data.email || data.email.length < 3 || data.email.indexOf( "@" ) < 0 )
        myError( "need a valid email address" );

    if ( ! request.pass1 || request.pass1.length < 6 )
        myError( "password too short" );

    if ( request.pass1 != request.pass2 )
        myError( "passwords need to match" );
}

if ( "signup" == request.action ){

    validateAccount();
    validateGit();
    
    if ( ! haveErrors ){
        var theSite = theCloud.findSite( data.name , true );
        
        theSite.giturl = data.giturl;

        var newUser = new User();
        newUser.name = data.username;
        newUser.email = data.email;
        newUser.email2 = data.email2;
        newUser.phone = data.phone;
        newUser.setPassword( request.pass1 , data.name );
        newUser.addPermission( "admin" );

        theSite.defaultUsers = [ newUser ];

        theSite.upsertDB( "prod" );
        theSite.upsertEnvironment( "www" , "master" , "prod" );
        theSite._save();
        step = "finish";
    }
}

assert( __path__.views[step] , "no step [" + step + "]" );
__path__.views[step]( data );

htmlfooter();
