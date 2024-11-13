import "./style.css";
import { createButton, createImage } from "../utils/helper";
import googleIcon from "../../public/google-logo.svg";
import { initializeGoogleAuth } from "../auth/auth";

// Initialize Google Auth
const googleAuth = initializeGoogleAuth();
let user = null;

// Wait for DOM to be loaded
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#app").innerHTML = `
    <div class="container">
      <h1>HitMagnet Thumbnail Collector</h1>
      <div id="signin-container"></div>
    </div>
  `;

  // Get DOM elements after they're created
  const signinContainer = document.querySelector("#signin-container");

  const signIn = async () => {
    user = await googleAuth.signIn();
    if (user.success) {
      signinContainer.innerHTML = `
      <div class="user-info">
        <img class="user-picture" src="${user.user.picture}" alt="User Picture" />
        <p class="user-name">${user.user.name}</p>
        <button class="btn signout-button" id="signout-button">Sign out</button>
      </div>
      `;
      document
        .querySelector("#signout-button")
        .addEventListener("click", signOut);
    }
  };

  const signOut = async () => {
    await googleAuth.signOut();
    user = null;
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

  signinContainer.appendChild(
    createButton(
      "signin-button",
      "Sign in with Google",
      signIn,
      "googleSignin",
      createImage(googleIcon, "google-icon")
    )
  );
});
