// ==============================
// CASOC FULL JAVASCRIPT SYSTEM
// ==============================

// Run initial setup
document.addEventListener("DOMContentLoaded", () => {
  protectRoute();
  loadProfile();
  loadTabs();
  loadCoverPhoto();
  loadFeed();
});

const currentUser = getCurrentUser()?.username || "Guest";

// Upload profile avatar
function uploadPic(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    const userData = getUserData();
    userData.profilePic = reader.result;
    saveUserData(userData);
    document.getElementById("profilePic").src = reader.result;
  };
  reader.readAsDataURL(file);
}

// Upload cover image
function uploadCover(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem("coverPhoto", reader.result);
    document.getElementById("coverPhoto").src = reader.result;
  };
  reader.readAsDataURL(file);
}

// Save profile name and bio
function saveProfile() {
  const name = document.getElementById("edit-username").value;
  const bio = document.getElementById("edit-bio").value;
  const userData = getUserData();
  userData.bio = bio;
  saveUserData(userData);
  localStorage.setItem("username", name);
  alert("✅ Profile updated!");
}

// Load profile details
function loadProfile() {
  const userData = getUserData();
  document.getElementById("profilePic").src = userData.profilePic || "https://api.dicebear.com/6.x/thumbs/svg?seed=CasinoPlayer";
  document.getElementById("edit-username").value = localStorage.getItem("username") || "";
  document.getElementById("edit-bio").value = userData.bio || "";
  document.getElementById("followerCount").textContent = userData.followers || 0;
  loadProfilePosts();
}

// Save new profile post
function addProfilePost() {
  const textarea = document.getElementById("newProfilePost");
  const msg = textarea.value.trim();
  if (!msg) return;
  const posts = JSON.parse(localStorage.getItem("profilePosts") || "[]");
  posts.unshift({
    user: currentUser,
    text: msg,
    date: new Date().toLocaleString()
  });
  localStorage.setItem("profilePosts", JSON.stringify(posts));
  textarea.value = "";
  loadProfilePosts();
}

// Load profile post list
function loadProfilePosts() {
  const posts = JSON.parse(localStorage.getItem("profilePosts") || "[]");
  const container = document.getElementById("profilePosts");
  if (!container) return;
  document.getElementById("postCount").textContent = posts.length;
  container.innerHTML = posts.map(p => `
    <div class="post">
      <strong>${p.user}</strong><br>
      ${p.text}<br>
      <small>${p.date}</small>
    </div>
  `).join("");
}

// Tab switching logic
function switchTab(tabId) {
  const contents = document.querySelectorAll(".tab-content");
  const buttons = document.querySelectorAll(".tabs button");
  contents.forEach(el => el.style.display = "none");
  buttons.forEach(btn => btn.classList.remove("active"));
  document.getElementById(`${tabId}Tab`).style.display = "block";
  document.querySelector(`.tabs button[onclick*='${tabId}']`).classList.add("active");
}

function loadTabs() {
  switchTab("posts");
}

// Follow system
function followUser() {
  const userData = getUserData();
  userData.followers = (userData.followers || 0) + 1;
  saveUserData(userData);
  document.getElementById("followerCount").textContent = userData.followers;
}

// Cover photo loader
function loadCoverPhoto() {
  const savedCover = localStorage.getItem("coverPhoto");
  if (savedCover) {
    document.getElementById("coverPhoto").src = savedCover;
  }
}

// Feed post creation
function createPost() {
  const content = document.getElementById("postInput").value;
  const file = document.getElementById("mediaUpload").files[0];
  if (!content && !file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const mediaUrl = file ? e.target.result : null;
    const post = {
      id: crypto.randomUUID(),
      author: currentUser,
      text: content,
      media: mediaUrl,
      timestamp: new Date().toLocaleString(),
      likes: [],
      shares: 0,
      comments: []
    };
    const feed = getFeed();
    feed.unshift(post);
    saveFeed(feed);
    document.getElementById("postInput").value = "";
    document.getElementById("mediaUpload").value = "";
    loadFeed();
  };
  if (file) reader.readAsDataURL(file);
  else reader.onload();
}

// Feed rendering
function loadFeed() {
  const feed = getFeed();
  const feedContainer = document.getElementById("newsFeed");
  if (!feedContainer) return;
  feedContainer.innerHTML = "";
  feed.forEach((post, index) => {
    const totalComments = post.comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
    const postEl = document.createElement("div");
    postEl.className = "post";
    postEl.innerHTML = `
      <div class="post-header">
        <img src="assets/avatar.png" class="avatar" alt="User">
        <div class="post-user-info">
          <strong>${post.author}</strong><br>
          <span class="post-time">${post.timestamp}</span>
        </div>
      </div>
      <div class="post-text">${post.text}</div>
      ${post.media ? `<div class="post-media"><img src="${post.media}" alt="Media" onclick="openModal('${post.media}')"></div>` : ""}
      <div class="post-stats">
        <span onclick="showLikes(${index})">👍 ${post.likes.length} Likes</span> |
        <span>💬 ${totalComments} Comments</span> |
        <span>↗️ ${post.shares} Shares</span>
      </div>
      <div class="post-actions">
        <button onclick="likePost(${index})">👍 Like</button>
        <button onclick="toggleCommentBox(${index})">💬 Comment</button>
        <button onclick="sharePost(${index})">↗️ Share</button>
      </div>
      <div id="commentBox${index}" class="post-comment-section" style="display:none;">
        <input type="text" placeholder="Write a comment..." class="comment-input" onkeydown="submitComment(event, ${index})">
        <div class="comment-thread" id="comments${index}">
          ${post.comments.map((c, i) => `
            <div class='comment'>
              <img src='assets/avatar.png' class='avatar-small'>
              <strong>${c.user}:</strong> ${c.text}
              <div class="comment-actions">
                <button onclick="likeComment(${index}, ${i})">👍 (${c.likes?.length || 0})</button>
                <button onclick="toggleReplyBox(${index}, ${i})">Reply</button>
                <div id="replyBox${index}_${i}" class="reply-box" style="display:none;">
                  <input type="text" placeholder="Write a reply..." onkeydown="submitReply(event, ${index}, ${i})">
                </div>
              </div>
              ${(c.replies || []).map(r => `
                <div class="reply">
                  <img src='assets/avatar.png' class='avatar-small'>
                  <strong>${r.user}:</strong> ${r.text}
                </div>`).join("")}
            </div>`).join("")}
        </div>
      </div>
    `;
    feedContainer.appendChild(postEl);
  });
}

// Like post
function likePost(index) {
  const feed = getFeed();
  if (!feed[index].likes.includes(currentUser)) {
    feed[index].likes.push(currentUser);
    saveFeed(feed);
    loadFeed();
  }
}

// Show likes
function showLikes(index) {
  const feed = getFeed();
  alert("Users who liked this post:\n" + (feed[index].likes.join("\n") || "No likes yet"));
}

// Share post
function sharePost(index) {
  const feed = getFeed();
  feed[index].shares += 1;
  saveFeed(feed);
  alert("Post shared to your profile! (simulated)");
  loadFeed();
}

// Toggle comment box
function toggleCommentBox(index) {
  const box = document.getElementById(`commentBox${index}`);
  box.style.display = box.style.display === "none" ? "block" : "none";
}

// Submit comment
function submitComment(event, index) {
  if (event.key === "Enter") {
    const input = event.target;
    const commentText = input.value.trim();
    if (!commentText) return;
    const feed = getFeed();
    feed[index].comments.push({ user: currentUser, text: commentText, likes: [], replies: [] });
    saveFeed(feed);
    input.value = "";
    loadFeed();
  }
}

// Like a comment
function likeComment(postIndex, commentIndex) {
  const feed = getFeed();
  const comment = feed[postIndex].comments[commentIndex];
  if (!comment.likes.includes(currentUser)) {
    comment.likes.push(currentUser);
    saveFeed(feed);
    loadFeed();
  }
}

// Toggle reply box
function toggleReplyBox(postIndex, commentIndex) {
  const box = document.getElementById(`replyBox${postIndex}_${commentIndex}`);
  box.style.display = box.style.display === "none" ? "block" : "none";
}

// Submit reply
function submitReply(event, postIndex, commentIndex) {
  if (event.key === "Enter") {
    const input = event.target;
    const replyText = input.value.trim();
    if (!replyText) return;
    const feed = getFeed();
    const comment = feed[postIndex].comments[commentIndex];
    if (!comment.replies) comment.replies = [];
    comment.replies.push({ user: currentUser, text: replyText });
    saveFeed(feed);
    input.value = "";
    loadFeed();
  }
}

// Image zoom modal
function openModal(imageSrc) {
  document.getElementById("imageModal").style.display = "block";
  document.getElementById("zoomedImg").src = imageSrc;
}

function closeModal() {
  document.getElementById("imageModal").style.display = "none";
}

// Session & storage helpers
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("casocSession")) || null;
}

function getUserData() {
  return JSON.parse(localStorage.getItem("profileData_" + currentUser)) || {};
}

function saveUserData(data) {
  localStorage.setItem("profileData_" + currentUser, JSON.stringify(data));
}

function getFeed() {
  return JSON.parse(localStorage.getItem("casocFeed")) || [];
}

function saveFeed(feed) {
  localStorage.setItem("casocFeed", JSON.stringify(feed));
}

// Auth functions
function registerUser(event) {
  event.preventDefault();
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;
  if (!username || !password) {
    alert("All fields are required!");
    return false;
  }
  const users = JSON.parse(localStorage.getItem("casocUsers")) || [];
  if (users.find(user => user.username === username)) {
    alert("Username already exists!");
    return false;
  }
  users.push({ username, password });
  localStorage.setItem("casocUsers", JSON.stringify(users));
  alert("Registration successful! You can now login.");
  window.location.href = "login.html";
  return false;
}

function fakeLogin(event) {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const users = JSON.parse(localStorage.getItem("casocUsers")) || [];
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem("casocSession", JSON.stringify(user));
    alert("Login successful!");
    window.location.href = "index.html";
  } else {
    alert("Invalid username or password.");
  }
}

function logout() {
  localStorage.removeItem("casocSession");
  window.location.href = "login.html";
}

function protectRoute() {
  if (!getCurrentUser()) {
    window.location.href = "login.html";
  }
}
