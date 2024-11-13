import "./style.css";
import { createButton, createImage } from "../utils/helper";
import googleIcon from "../../public/google-logo.svg";
import { initializeGoogleAuth } from "../auth/auth";

// Initialize Google Auth
const googleAuth = initializeGoogleAuth();

document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector("#app").innerHTML = `
    <div class="container">
      <h1>HitMagnet Thumbnail Collector</h1>
      <div id="signin-container"></div>
    </div>
  `;

  const signinContainer = document.querySelector("#signin-container");

  const renderUserInfo = (user) => {
    signinContainer.innerHTML = `
      <div class="user-info">
        <img class="user-picture" src="${user.picture}" alt="User Picture" />
        <p class="user-name">${user.name}</p>
        <button class="btn signout-button" id="signout-button">Sign out</button>
      </div>
    `;
    document
      .querySelector("#signout-button")
      .addEventListener("click", signOut);
  };

  const renderSignInButton = () => {
    signinContainer.innerHTML = "";
    signinContainer.appendChild(
      createButton(
        "signin-button",
        "Sign in with Google",
        signIn,
        "googleSignin",
        createImage(googleIcon, "google-icon")
      )
    );
  };

  const signIn = async () => {
    const signInResult = await googleAuth.signIn();
    if (signInResult.success) {
      renderUserInfo(signInResult.user);
    }
  };

  const signOut = async () => {
    await googleAuth.signOut();
    renderSignInButton();
  };

  // Check auth state when popup opens
  const authState = await googleAuth.checkAuthState();
  if (authState.isAuthenticated && authState.user) {
    renderUserInfo(authState.user);
  } else {
    renderSignInButton();
  }
});
