import "./style.css";
import { createButton, createImage } from "../utils/helper";
import googleIcon from "../../public/google-logo.svg";
import logo from "../../public/assets/logos/Logo.svg";

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
      <div class="app-header">

        <img src="${logo}" alt="HitMagnet Logo" height="30" class="app-logo" />
        <span class="app-subtitle">Thumbnail Collector</span>
      </div>
      <div id="signin-container"></div>
      <div id="status-message" class="status-message"></div>
    </div>
  `,

  userInfo: (user, isInactive) => `
    <div class="user-info">
      <div class="user-header">
        <img class="user-picture" src="${user.picture}" alt="User Picture" />
        <div class="user-details">
          <p class="user-name">${user.name}</p>
          ${
            isInactive
              ? `
            <div class="subscription-status inactive">
              <span class="status-text">Free Plan</span>
              <button class="btn upgrade-button" onclick="window.open('https://www.hitmagnet.app/', '_blank')">
                Upgrade to Pro
              </button>
            </div>
          `
              : `
            <div class="subscription-status active">
              <span class="status-badge">
                <span class="status-icon">✓</span>
                Pro
              </span>
            </div>
          `
          }
        </div>
      </div>
      <button class="btn signout-button" id="signout-button">
        Sign out
      </button>
    </div>
  `,
};

// Initialize Google Auth
const auth = authHandlers();
// Main authentication controller
class AuthController {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.statusMessage = document.querySelector("#status-message");
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

  showStatusMessage = (message, type = "info") => {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
    setTimeout(() => {
      this.statusMessage.className = "status-message";
      this.statusMessage.textContent = "";
    }, 3000);
  };

  signIn = async () => {
    try {
      this.showStatusMessage("Signing in...", "info");
      const result = await auth.signIn();

      if (result?.isAuthenticated && result?.user) {
        this.showStatusMessage("Signed in successfully", "success");
        await this.updateAuthState(result);
        this.renderUserInfo(result.user);
      } else {
        throw new Error("Sign in failed");
      }
    } catch (error) {
      console.error("Error during sign in process:", error);
      this.showStatusMessage("Sign in failed. Please try again.", "error");
    }
  };

  updateAuthState = async (authState) => {
    try {
      // Send message to background script to update auth state
      await chrome.runtime.sendMessage({
        type: "updateAuthState",
        authState,
      });
    } catch (error) {
      console.error("Error updating auth state:", error);
      throw error;
    }
  };

  signOut = async () => {
    try {
      this.showStatusMessage("Signing out...", "info");
      await auth.signOut();

      // Clear UI
      const container = document.getElementById("app");
      container.innerHTML = "";

      // Show sign-in button
      this.renderSignInButton();

      this.showStatusMessage("Signed out successfully", "success");

      // Close the popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error) {
      console.error("Error during sign out:", error);
      this.showStatusMessage("Sign out failed. Please try again.", "error");
    }
  };
}

// Main initialization
document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector(DOM.APP_SELECTOR).innerHTML =
    templates.mainContainer();

  const authController = new AuthController(DOM.SIGNIN_CONTAINER_SELECTOR);

  // Check initial auth state
  const authState = await auth.checkAuthState();
  if (authState.isAuthenticated && authState.user) {
    authController.renderUserInfo(authState.user);
  } else {
    authController.renderSignInButton();
  }
});
