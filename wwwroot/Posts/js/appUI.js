const periodicRefreshPeriod = 10;
let contentScrollPosition = 0;
var selectedCategory;
let selectedText = "";
let currentETag = "";
let hold_Periodic_Refresh = false;

Init_UI();

async function Init_UI() {
  renderPosts();
  $("#createPost").on("click", async function () {
    renderCreatePostForm();
  });
  $("#abort").on("click", async function () {
    renderPosts();
  });
  $("#search").on("input", async function () {
    selectedText = $("#search").val();
    renderPosts();
  });
  $("#categorySearch").on("change", async function () {
    selectedCategory = $("#categorySearch").val();
    renderPosts();
  });
}



function eraseContent() {
  $("#content").empty();
}
async function renderPosts(refresh = true) {
  $("#actionTitle").text("Liste des publications");
  $("#createPost").show();
  $("#abort").hide();
  $("#sortPanel").show();
  let response = await Posts_API.Get();
  if(refresh)
  eraseContent();
  let Posts = response.data;

  if (Posts !== null) {
    let selectedPosts = [];
    let categories = [];
    Posts = Posts.reverse();
    Posts.forEach((Post) => {
        if(!categories.includes(Post.Category)){
            categories.push(Post.Category);
        }
        if (
            selectedCategory == undefined || selectedCategory == Post.Category &&
            (Post.Title.toLowerCase().includes(selectedText.toLowerCase()) ||
              Post.Text.toLowerCase().includes(selectedText.toLowerCase()))
          ) {
            selectedPosts.push(Post);
          }
    })
    $("#categorySort").empty();
    $("#categorySort").append(`<option value="all">Tous les articles</option>`);
    categories.forEach((category) => {
      $("#categorySort").append(`<option value="${category}">${category}</option>`);
    })
    selectedPosts.forEach((Post) => {
      $("#content").append(renderPost(Post));
    });
    $(".edit-icon").on("click", async function () {
      renderEditPostForm($(this).attr("editPostId"));
    });
    $(".delete-icon").on("click", async function () {
      renderDeletePostForm($(this).attr("deletePostId"));
    });
  } else {
    renderError("Service introuvable");
  }
}
function renderPost(Post) {
  return $(`
        <div class="post">
            <img src="${Post.Image}" alt="${Post.Title}" class="post-image">
            <div class="post-details">
                <span class="post-category">${Post.Category}</span>
                <div class="post-titleContainer">
                    <h2 class="post-title">${Post.Title}</h2>
                    
                    <div class="post-actions">
                        <i class="fas fa-edit edit-icon" editPostId = ${
                          Post.Id
                        } title="Modifier ${Post.Title}"></i>
                        <i class="fas fa-trash delete-icon" deletePostId = ${
                          Post.Id
                        } title="Supprimer ${Post.Title}"></i>
                    </div>
                </div>
                <p class="post-date">${convertToFrenchDate(Post.Creation)}</p>
                <p class="post-text">${Post.Text}</p>
            </div>
        </div>
        `);
}
function renderCreatePostForm() {
  renderPostForm();
}
async function renderEditPostForm(id) {
  let post = await Posts_API.Get(id);
  if (post !== null) {
    renderPostForm(post.data);
  } else {
    renderError("Publication introuvable");
  }
}
function renderPostForm(post = null) {
  $("#createPost").hide();
  $("#abort").show();
  $("#sortPanel").hide();
  eraseContent();
  let create = post == null;
  if (create) {
    post = newPost();
  }
  $("#actionTitle").text(create ? "Création" : "Modification");
  $("#content").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${post.Id}"/>

            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal" 
                value="${post.Title}"
            />
            <label for="Text" class="form-label">Texte</label>
            <textarea class="form-control" name="Text" id="Text" cols="30" rows="10" placeholder="Texte" required>${post.Text}</textarea>
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                RequireMessage="Veuillez entrer une catégorie" 
                InvalidMessage="Veuillez entrer une catégorie valide"
                value="${post.Category}"
            />
            <!-- nécessite le fichier javascript 'imageControl.js' -->
            <label class="form-label">Image </label>
            <div   class='imageUploader' 
                   newImage='${post}' 
                   controlId='Image' 
                   imageSrc='${post.Image}' 
                   waitingImage="Loading_icon.gif">
            </div>
            <hr>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
        `);
  initImageUploaders();
  $("#postForm").on("submit", async function (e) {
    e.preventDefault();
    let post = getFormData($("#postForm"));
    post.Creation = new Date().getTime();
    let result = await Posts_API.Save(post, create);
    if (result) {
      renderPosts();
    } else {
      renderError("Echec de l'enregistrement");
    }
  });
  $("#cancel").on("click", function () {
    renderPosts();
  });
}
async function renderDeletePostForm(id) {
  $("#createPost").hide();
  $("#abort").show();
  $("#actionTitle").text("Suppression");
  $("#sortPanel").hide();
  let response = await Posts_API.Get(id);
  let Post = response.data;
  eraseContent();
  $("#content").append(`
        <div class="PostDeleteForm">
            <h4>Effacer la publication suivante?</h4>
            <br>
            <div class="post">
            <img src="${Post.Image}" alt="${Post.Title}" class="post-image">
            <div class="post-details">
                <span class="post-category">${Post.Category}</span>
                <h2 class="post-title">${Post.Title}</h2>
                <p class="post-date">${convertToFrenchDate(Post.Creation)}</p>
                <p class="post-text">${Post.Text}</p>
            </div>
            </div>
            <br>
            <input type="button" value="Effacer" id="deletePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div> 
        `);
  $("#deletePost").on("click", async function () {
    let result = await Posts_API.Delete(id);
    if (result) {
      renderPosts();
    } else {
      renderError("Echec de la suppression");
    }
  });
  $("#cancel").on("click", function () {
    renderPosts();
  });
}

function renderError(message) {
  eraseContent();
  $("#content").append(
    $(`
        <div class="errorContainer">
            ${message}
        </div>
        `)
  );
  console.log(message);
}

function newPost() {
  post = {};
  post.Id = 0;
  post.Title = "";
  post.Text = "";
  post.Category = "";
  post.Image = "";
  post.Creation = 0;
  return post;
}
function getFormData($form) {
  const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
  var jsonObject = {};
  $.each($form.serializeArray(), (index, control) => {
    jsonObject[control.name] = control.value.replace(removeTag, "");
  });
  return jsonObject;
}
function convertToFrenchDate(numeric_date) {
  date = new Date(numeric_date);
  var options = { year: "numeric", month: "long", day: "numeric" };
  var opt_weekday = { weekday: "long" };
  var weekday = toTitleCase(date.toLocaleDateString("fr-FR", opt_weekday));

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
  return (
    weekday +
    " le " +
    date.toLocaleDateString("fr-FR", options) +
    " @ " +
    date.toLocaleTimeString("fr-FR")
  );
}
