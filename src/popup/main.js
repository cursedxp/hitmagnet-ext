import "./style.css";
import { createButton, createImage } from "../utils/helper";
import googleIcon from "../../public/google-logo.svg";
import { initializeGoogleAuth } from "../auth/auth";

// Constants for DOM elements and selectors
const DOM = {
  APP_SELECTOR: "#app",
  SIGNIN_CONTAINER_SELECTOR: "#signin-container",
  SIGNOUT_BUTTON_SELECTOR: "#signout-button",
};

// Template functions for better HTML organization
const templates = {
  mainContainer: () => `
    <div class="container">
      <h1>HitMagnet Thumbnail Collector</h1>
      <div id="signin-container"></div>
    </div>
  `,

  userInfo: (user) => `
    <div class="user-info">
      <img class="user-picture" src="${user.picture}" alt="User Picture" />
      <p class="user-name">${user.name}</p>
      <button class="btn signout-button" id="signout-button">Sign out</button>
    </div>
  `,
};

// Initialize Google Auth
const googleAuth = initializeGoogleAuth();

// Main authentication controller
class AuthController {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
  }

  renderUserInfo = (user) => {
    this.container.innerHTML = templates.userInfo(user);
    document
      .querySelector(DOM.SIGNOUT_BUTTON_SELECTOR)
      .addEventListener("click", this.signOut);
  };

  renderSignInButton = () => {
    this.container.innerHTML = "";
    this.container.appendChild(
      createButton(
        "signin-button",
        "Sign in with Google",
        this.signIn,
        "googleSignin",
        createImage(googleIcon, "google-icon")
      )
    );
  };

  signIn = async () => {
    const signInResult = await googleAuth.signIn();
    if (signInResult.success) {
      this.renderUserInfo(signInResult.user);
    }
  };

  signOut = async () => {
    await googleAuth.signOut();
    this.renderSignInButton();
  };
}

// Main initialization
document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector(DOM.APP_SELECTOR).innerHTML =
    templates.mainContainer();

  const authController = new AuthController(DOM.SIGNIN_CONTAINER_SELECTOR);

  // Check initial auth state
  const authState = await googleAuth.checkAuthState();
  if (authState.isAuthenticated && authState.user) {
    authController.renderUserInfo(authState.user);
  } else {
    authController.renderSignInButton();
  }
});
