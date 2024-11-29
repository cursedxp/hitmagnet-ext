import "./style.css";
import { createButton, createImage } from "../utils/helper";
import googleIcon from "../../public/google-logo.svg";
import { initializeGoogleAuth } from "../auth/auth";
import { getUserSubscriptionStatus } from "../background/firebaseServices";
import authHandlers from "../auth/authHandlers";

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

  userInfo: (user, isInactive) => `
    <div class="user-info">
      <img class="user-picture" src="${user.picture}" alt="User Picture" />
      <p class="user-name">${user.name}</p>
      ${
        isInactive
          ? `
        <div class="subscription-status inactive">
          <p>Inactive Subscription</p>
          <button class="btn upgrade-button" onclick="window.open('https://www.hitmagnet.app/', '_blank')">
            Upgrade Now
          </button>
        </div>
      `
          : `
        <div class="subscription-status active">
          <div class="subscription-status-icon">👑</div>
          <div>Pro</div>
        </div>
      `
      }
      <button class="btn signout-button" id="signout-button">Sign out</button>
    </div>
  `,
};

// Initialize Google Auth
const googleAuth = initializeGoogleAuth();
const auth = authHandlers();
// Main authentication controller
class AuthController {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
  }

  renderUserInfo = (user, isInactive = false) => {
    this.container.innerHTML = templates.userInfo(user, isInactive);
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
    try {
      const signInResult = await auth.signIn();
      console.log("Sign in result:", signInResult);

      if (signInResult.subscriptionStatus === "inactive") {
        this.renderUserInfo(signInResult.user, true);
      } else {
        this.renderUserInfo(signInResult.user);
      }
    } catch (error) {
      console.error("Error during sign in process:", error);
      // Handle error in UI
    }
  };

  signOut = async () => {
    await auth.signOut();
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
