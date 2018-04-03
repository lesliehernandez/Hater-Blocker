/*
    I'm going to try to make the requests with ajax, but it hasn't worked so far
    because the 'gapi.client' variable I used to make requests here is what knows the
    user is authenticated. Haven't figured out how to put that into an ajax request yet
*/

// Client ID from the Developer Console
var CLIENT_ID = '523678269215-p0ja18cn4qk6htkeh576j43lptlmqbds.apps.googleusercontent.com';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest", "https://language.googleapis.com/$discovery/rest?version=v1"];

// Authorization scopes required by the API. 
var SCOPES = 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/cloud-language';

var authorizeButton = document.getElementById('signup-btn');
var signoutButton = document.getElementById('signout-btn');
var dashboardButton = document.getElementById('dashboard-btn');

var deleteComments = 0;

/*
 *  On load, called to load the auth2 library and API client library.
 */

$(document).ready(handleClientLoad);

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/*
*  Initializes the API client library and sets up sign-in state
*  listeners.
*/

function initClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        console.log(gapi.auth2.getAuthInstance().currentUser.get());
        
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        if($('body').is('.landing')) {
            authorizeButton.onclick = handleAuthClick;
            signoutButton.onclick = handleSignoutClick;
            // window.location.href = "dashboard-feed-post.html";

        }
        else if ($('body').is('.dashboard-feed')) {
            getChannel();
        }
        else if ($('body').is('.dashboard-video')) {
            var currVideo = localStorage.getItem("currVideo");
            getVideo(currVideo, 380);
            $('.comment-list').empty();
            getComments(currVideo);
            $('#deleteBadComments').on('click', function (e) {  
                e.preventDefault();
                deleteComments = 1;
                getComments(currVideo);
               

                // Need to fix showing not showing bad comment if it is deleted last          
            });
        }
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */

// This will show/hide login/logout buttons
// Login button isn't implemented with the apis yet
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'block';
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    console.log(gapi.auth2.getAuthInstance());
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append text to a pre element in the body, adding the given message
 * to a text node in that element. Used to display info from API response.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
    var pre = document.getElementById('content');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}

function getChannel() {

    // Request channel information
    // Parameter 'mine' : true get the currently authenticated users channel
    var request = gapi.client.request({
        'method': 'GET',
        'path': '/youtube/v3/channels',
        'params': {'part': 'contentDetails', 'mine': 'true'}
    }).then(function(response) {

        var channel = response.result.items[0];

        // Save the id of their uploaded videos playlist
        var playlistId = channel.contentDetails.relatedPlaylists.uploads;
        // Call getPlaylist with the uploads playlist id
        getPlaylist(playlistId);
    });
}

function getPlaylist(playlistId){

    // Request information about a playlist
    // list specified number of videos with maxResults parameter
    var request = gapi.client.youtube.playlistItems.list({
        'method': 'GET',
        'playlistId' : playlistId,
        'part': 'snippet',
        // User can choose number of videos to show
        'maxResults' : 20
    }).then(function(response) {
        $('.comment-list').empty();
        
        // Save array of video responses
        var videoIds = response.result.items;

        videoIds.forEach(video => {
            // For each video in the playlist, save the videoId
            var videoId = video.snippet.resourceId.videoId;
            getVideo(videoId, 60);
            // getComments(videoId);
        });
    });
}
// May not need this request
function getVideo(vidId, size){
    var request = gapi.client.request({
        'method': 'GET',
        'path': '/youtube/v3/videos',
        'params': {'part': 'snippet,contentDetails,statistics','id' : vidId}
    }).then(function(response) {
        // var videoIds = response.result.items;
        console.log(response.result.items[0]); 

        var video = $('<a>');
        video.append('<span style:"float:left;clear:none;text-decoration:none;"><img src=' + response.result.items[0].snippet.thumbnails.high.url + ' style="width:'+size+'px;box-shadow:0px 0px 0px black;"/><p style="color:black;">' + response.result.items[0].snippet.title + '</p></span>');
        video.append('<br><br>')
             .addClass('video')       
             .attr('data-vidId', response.result.items[0].id)
             .attr('href', 'dashboard-video.html');

        // videoSpace.append(video);
        $('.image-overlay').prepend(video);
    });
}

$(document).on('click', '.video', function() {
    console.log('data: ' + $(this).data('vidid'));
    if($(this).data('vidid') != undefined) {
        localStorage.setItem("currVideo",$(this).data('vidid'));
    }
})

// Get comments from the video specified in videoId
function getComments(vidId){
    var request = gapi.client.request({
        'method': 'GET',
        'path': '/youtube/v3/commentThreads',
        'params': {'part': 'snippet','videoId' : vidId, 'maxResults': 20},
        
    }).then(function(response) {
        // Save commentId array
        var commentIds = response.result.items;

        $('#numComments').text(commentIds.length);
        // For each comment, call getComment with the commentId
        // Maybe call setModStatus instead
        commentIds.forEach(comment => {
            // var videoId = video.snippet.resourceId.videoId;
            getComment(comment.id);
        });
    });
}

function getComment(commentId){
    var request = gapi.client.request({
        'method': 'GET',
        'path': '/youtube/v3/comments',
        'params': {'id':commentId, 'part': 'snippet'},
        
    }).then(function(response) {
        // var videoIds = response.result.items;

        var userImg = response.result.items[0].snippet.authorProfileImageUrl;
        var author = response.result.items[0].snippet.authorDisplayName;
        var commentText = response.result.items[0].snippet.textDisplay; 
        // Deletes bad comments, need a button to delete them
        
        var numComments = $('#numComments').text();

        // Display comments
        if(deleteComments == 1 && $('[comment="'+commentId+'"]').prop('checked')) {
            setModerationStatus(commentId);
            if($('#' + commentId).length)
                $('#' + commentId).empty();
            
            $('#numComments').text(numComments - 1);
            // console.log("hi: "+$('[comment="'+commentId+'"]').prop('checked'));
        }
        // else show comment
        else {
            if($('#' + commentId).length)
                $('#' + commentId).empty();
            // Show replies
            var listItem = $("<li>");
                listItem.addClass('media')
                        .attr('id', commentId);

            var commenterImage = $('<div>');
                commenterImage.addClass('media-left is-hidden-mobile')
                            .html('<a href=' +  response.result.items[0].snippet.authorChannelUrl + '><img src=' + userImg + ' alt=""></a>');
            
                listItem.append(commenterImage);

            var mediaBody = $('<div>');
                mediaBody.addClass('media-body')
                        .attr('text', commentText);


            var mediaHeading = $('<div>');
                mediaHeading.addClass('media-heading')
                            .append('<a href=' + response.result.items[0].snippet.authorChannelUrl + ' class="text-semibold">' + author + '</a>')
                            // Use library to get how long ago they posted it
                            // Order comments by data send
                            .append('<span class="timestamp">2 minutes ago</span>')
                            
            var checkBox = $('<input>');
                checkBox.addClass('check-box')
                        .attr('type', 'checkbox')
                        .html('<span class="checkmark"></span>')
                        .attr('comment', commentId);
            
                mediaBody.append(mediaHeading, checkBox)
                        .append('<p>' + commentText + '</p>');
            
            var commentControls = $('<ul>');
                commentControls.addClass('comment-controls')
                                .append('<li>' + response.result.items[0].snippet.likeCount + ' ' + '<i class="material-icons">thumb_up</i></a><a href="#"><i class="icon-arrow-down22 text-danger"></i></a></li>');
                
                mediaBody.append(commentControls);

                listItem.append(mediaBody);

            $('.comment-list').prepend(listItem);

            initGapi(commentText, commentId);

        }
    
    });
}
// Sets the moderation status of a comment as rejected
function setModerationStatus(commentId) {
    var request = gapi.client.youtube.comments.setModerationStatus({
        'id' : commentId, 'moderationStatus':'rejected'
    });
    request.execute(function (response) {  
        // console.log(response);
    });
}

var naturalLanguageKey = 'AIzaSyBqEJr9IauQFTzkj79rk0n0RMzDxY_VruE';

function initGapi(content, id) {
    gapi.client.setApiKey(naturalLanguageKey);
    gapi.client.load('language', 'v1', function () {  

    });
    gapi.client.language.documents.analyzeEntitySentiment({
        'document' : {
            type: 'PLAIN_TEXT',
            language: "EN",
            content: content
        },
        'encodingType' : "UTF8"
    }).then(function (r) {  
        var commentScore = JSON.stringify(r.result.entities[0].sentiment.score);
        console.log(content + " Score: " + commentScore);

        // if(deleteComments == 1) {
        //     // setModerationStatus(id);
        //     console.log("hi: "+$('[findText="'+content+'"]').prop('checked'));
        // }
        if(commentScore <= -0.6) {

            $(".media-body:contains(" + content + ")").css('border', '2px solid red');

            $('[comment="'+id+'"]').prop('checked',true);
        }
    }) 
} 
