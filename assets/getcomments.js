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
var currVideo;
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
            // signoutButton.onclick = handleSignoutClick;
            // window.location.href = "dashboard-feed-post.html";
        }
        else if ($('body').is('.dashboard-feed')) {
            getChannel();
        }
        else if ($('body').is('.dashboard-video')) {
            // authorizeButton.onclick = handleAuthClick;
            signoutButton.onclick = handleSignoutClick;
            // Get current video id from local storage
            currVideo = localStorage.getItem("currVideo");
            // Get current video, call with a greater width
            getVideo(currVideo, 380);
            // Empty comment list div
            $('.comment-list').empty();
            // Get comments on current video
            getComments(currVideo);
           
        }
    });
}
 // If delete comments is clicked
 $('#deleteBadComments').on('click', function (e) {  
    // Prevent page refresh
    e.preventDefault();
    // Set delete comments to true
    deleteComments = 1;
    // Call get comments to delete and show
    getComments(currVideo);

});
/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */

// This will show/hide login/logout buttons
// Login button isn't implemented with the apis yet
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        // authorizeButton.style.display = 'block';
        // signoutButton.style.display = 'block';
    } else {
        // authorizeButton.style.display = 'block';
        // signoutButton.style.display = 'none';
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

var numVideos = 0;
var numRows = 1;

// May not need this request
function getVideo(vidId, size){
    var request = gapi.client.request({
        'method': 'GET',
        'path': '/youtube/v3/videos',
        'params': {'part': 'snippet,contentDetails,statistics','id' : vidId}
    }).then(function(response) {
        numVideos++;
        
        console.log(response.result.items[0]); 
        if ($('body').is('.dashboard-feed')) {
            // var video = $('<div>');

            if(numVideos == 1) {
        console.log(numRows);
                
                var newRow = $('<div>');
                    newRow.addClass('row')
                          .attr('id', 'row-'+numRows);
                var newCol = $('<div>');
                    newCol.addClass('col-sm');
        
                var newVideo = $('<a>');
                    newVideo.append('<span><img class="video" src=' + response.result.items[0].snippet.thumbnails.high.url + ' style="width:150px;box-shadow:0px 0px 0px black;"/><p style="color:black;">' + response.result.items[0].snippet.title + '</p></span>')
                        .append('<br><br>')
                        .addClass('video')       
                        .attr('data-vidId', response.result.items[0].id)
                        .attr('href', 'CommentDashboard.html');


                newCol.append(newVideo);

                $(newRow).append(newCol);

                $(".videoColum1").append(newRow);

                // numVideos++;
            }
            else if(numVideos > 1 && numVideos < 4) {
                console.log(numVideos);
                
                var newCol = $('<div>');
                    newCol.addClass('col-sm');
        
                var newVideo = $('<a>');
                    newVideo.append('<span><img class="video" src=' + response.result.items[0].snippet.thumbnails.high.url + ' style="width:150px;box-shadow:0px 0px 0px black;"/><p style="color:black;">' + response.result.items[0].snippet.title + '</p></span>')
                        .append('<br><br>')
                        .addClass('video')       
                        .attr('data-vidId', response.result.items[0].id)
                        .attr('href', 'CommentDashboard.html');

                newCol.append(newVideo);

                $('#row-' + numRows).append(newCol);

                $(".videoColum1").append($('#row-' + numRows));

                if(numVideos == 3) {
                    numRows++;
                    numVideos = 0;
                }
                // numVideos++;
            }
        }
        else if($('body').is('.dashboard-video')) {
            console.log('hi');
            var newVideo = $('<a>');
            newVideo.append('<span><img class="video" src=' + response.result.items[0].snippet.thumbnails.high.url + ' style="width:80%;height:80%;box-shadow:0px 0px 0px black;"/><p style="color:black;">' + response.result.items[0].snippet.title + '</p></span>')
                .append('<br><br>')
                .addClass('video')       
                .attr('data-vidId', response.result.items[0].id)
                .attr('href', 'CommentDashboard.html');

        $('#video-space').prepend(newVideo);
        }
            
           

            // video.append('<span><img class="video-img" src=' + response.result.items[0].snippet.thumbnails.high.url + ' style="width:'+size+'px;box-shadow:0px 0px 0px black;"/><p style="color:black;">' + response.result.items[0].snippet.title + '</p></span>')
            //      .append('<br><br>')
            //      .addClass('video-main')       
            //      .attr('data-vidId', response.result.items[0].id);
        
        // Append video
        // $('.image-overlay').prepend(video);
    });
}

$(document).on('click', '.video', function() {

    if($(this).data('vidid') != undefined) {
        // Save video id clicked to get when page changes
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

        var commentIds = response.result.items;
        // Set number of comments
        $('#numComments').text(commentIds.length);

        commentIds.forEach(comment => {
            // Get individial comment for display or deletion
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
        // Comment info variables
        var userImg = response.result.items[0].snippet.authorProfileImageUrl;
        var author = response.result.items[0].snippet.authorDisplayName;
        var commentText = response.result.items[0].snippet.textDisplay; 
        // Current number of comments
        var numComments = $('#numComments').text();
        // If delete is true and comment is checked for delete
        if(deleteComments == 1 && $('[comment="'+commentId+'"]').prop('checked')) {
            
            // If the comment was displayed, remove it from view
            if($('#' + commentId).length)
                $('#' + commentId).remove();
            // Delete the comment
            setModerationStatus(commentId);
            
            // Update number of comments
            $('#numComments').text(numComments - 1);
        }
        // If delete is not true or the comment is set to be deleted
        else {
            // If comment is already displayed, remove it so it does not duplicate
            var datePosted = moment(response.result.items[0].snippet.publishedAt).format('MMM Do YY, h:mm a');

            if($('#' + commentId).length)
                $('#' + commentId).remove();

            var listItem = $("<li>");
                listItem.addClass('media')
                        .attr('id', commentId);

            var commenterImage = $('<div>');
                commenterImage.addClass('media-left')
                            .html('<a href=' +  response.result.items[0].snippet.authorChannelUrl + '><img src=' + userImg + ' alt=""></a>');
            
            var checkBox = $('<input>');
                checkBox.addClass('check-box')
                    .attr('type', 'checkbox')
                    .html('<br><span class="checkmark"></span>')
                    .attr('comment', commentId);

                commenterImage.append(checkBox);
                listItem.append(commenterImage);

            var mediaBody = $('<div>');
                mediaBody.addClass('media-body')
                        .attr('text', commentText);

            var mediaHeading = $('<div>');
                mediaHeading.addClass('media-heading')
                            .append('<a href=' + response.result.items[0].snippet.authorChannelUrl + ' class="text-semibold">' + author + '</a>')
                            // Use library to get how long ago they posted it
                            // Order comments by data send
                            .append('<span class="timestamp"> '+datePosted+'</span>');
                            
                mediaBody.append(mediaHeading)
                        .append('<p class="comment-text">' + commentText + '</p>');
            
            var commentControls = $('<div>');
                commentControls.addClass('comment-controls')
                                .append(response.result.items[0].snippet.likeCount + ' ' + '<span class="glyphicon glyphicon-thumbs-up"></span>');
                
                mediaBody.append(commentControls);

                listItem.append(mediaBody);

            $('.comment-list').prepend(listItem);
            // Call function to score this comments sentiment
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
        // If the current comment has a low sentiment score
        if(commentScore <= -0.6) {
            // Outline comment in red
            $(".media-body:contains(" + content + ")").css('border', '2px solid red');
            // Check this comments checkbox for delete
            $('[comment="'+id+'"]').prop('checked',true);
        }
    }) 
} 
