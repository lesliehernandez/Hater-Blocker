  /*
        I'm going to try to make the requests with ajax, but it hasn't worked so far
        because the 'gapi.client' variable I used to make requests here is what knows the
        user is authenticated. Haven't figured out how to put that into an ajax request yet
      */

      // Client ID and API key from the Developer Console
    //   var CLIENT_ID = '523678269215-jaeetbolcu823451vj1mj3hcs0sj7t9j.apps.googleusercontent.com';
    var CLIENT_ID = '523678269215-p0ja18cn4qk6htkeh576j43lptlmqbds.apps.googleusercontent.com';

      // Array of API discovery doc URLs for APIs used by the quickstart
      var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest", "https://language.googleapis.com/$discovery/rest?version=v1"];

      // Authorization scopes required by the API. If using multiple scopes,
      // separated them with spaces.
      var SCOPES = 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/cloud-language';

      
      var authorizeButton = document.getElementById('signup-btn');
      var signoutButton = document.getElementById('signout-btn');
      var dashboardButton = document.getElementById('dashboard-btn');

      var deleteComments = 0;

      /**
       *  On load, called to load the auth2 library and API client library.
       */


      $(document).ready(handleClientLoad);

      function handleClientLoad() {
        gapi.load('client:auth2', initClient);
      }

      /**
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
            }
            else if ($('body').is('.dashboard-page')) {
                getChannel();
                $('#deleteBadComments').on('click', function () {  
                    deleteComments = 1;
                    getChannel();
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
            console.log(channel);

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
                getVideo(videoId);
                getComments(videoId);
            });
        });
    }
    // May not need this request
    function getVideo(vidId){
        var request = gapi.client.request({
            'method': 'GET',
            'path': '/youtube/v3/videos',
            'params': {'part': 'snippet,contentDetails,statistics','id' : vidId}
        }).then(function(response) {
            // var videoIds = response.result.items;
            console.log(response.result.items[0]); 

            var videoSpace = $('<div>');

            var video = $('<div>');
            // console.log(response.result.items[0].contentDetails);
            video.append('<span style:"float:left;clear:none;"><img src=' + response.result.items[0].snippet.thumbnails.default.url + ' style="width:60px;box-shadow:0px 0px 0px black;"/><p>' + response.result.items[0].snippet.title + '</p></span>');
            video.append('<br><br>')
            
            videoSpace.append(video);
            $('.image-overlay').prepend(video);


        });
    }
    // Get comments from the video specified in videoId
    function getComments(vidId){
        var request = gapi.client.request({
            'method': 'GET',
            'path': '/youtube/v3/commentThreads',
            'params': {'part': 'snippet','videoId' : vidId, 'maxResults': 3},
            
        }).then(function(response) {
            // Save commentId array
            var commentIds = response.result.items;
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
            console.log(response.result.items[0].snippet);

            var userImg = response.result.items[0].snippet.authorProfileImageUrl;
            var author = response.result.items[0].snippet.authorDisplayName;
            var commentText = response.result.items[0].snippet.textDisplay; 
            // Deletes bad comments, need a button to delete them
        
            initGapi(commentText, commentId);
            // Display comments

            // Show replies
            var listItem = $("<li>");
                listItem.addClass('media');

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
                        .attr('findText', commentText);
            
                mediaBody.append(mediaHeading, checkBox)
                         .append('<p>' + commentText + '</p>');
            
            var commentControls = $('<ul>');
                commentControls.addClass('comment-controls')
                               .append('<li>' + response.result.items[0].snippet.likeCount + ' ' + '<i class="material-icons">thumb_up</i></a><a href="#"><i class="icon-arrow-down22 text-danger"></i></a></li>');
                
                mediaBody.append(commentControls);

                listItem.append(mediaBody);

            $('.comment-list').prepend(listItem);
        
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
                // Union field source can be only one of the following:
                content: content
                // "gcsContentUri": string,
                // End of list of possible types for union field source.
            },
            'encodingType' : "UTF8"
        }).then(function (r) {  
            var commentScore = JSON.stringify(r.result.entities[0].sentiment.score);
            console.log(content + " Score: " + commentScore);

            if(deleteComments == 1) {
                // setModerationStatus(id);
                console.log("hi: "+$('[findText="'+content+'"]').prop('checked'));
                document.getElementBy
            }
            else if(commentScore <= -0.6 && deleteComments == 0) {

                $(".media-body:contains(" + content + ")").css('border', '2px solid red');

                $('[findText="'+content+'"]').prop('checked',true);
            }
        }) 
    } 
