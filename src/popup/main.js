import "./style.css";
import logo from "../../public/assets/logos/Logo.svg";
import { getUserSubscriptionStatus } from "../background/firebaseServices";

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
      <div id="signin-container">
         <button class="btn login-button" id="loginButton">
            Sign in to HitMagnet
          </button>
      </div>
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

// Main initialization
document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector(DOM.APP_SELECTOR).innerHTML =
    templates.mainContainer();
  const loginButton = document.getElementById("loginButton");
  loginButton.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://www.hitmagnet.app/" });
  });
});
