import "./style.css";
import { createButton, createImage } from "../utils/helper";
import googleIcon from "../../public/google-logo.svg";

document.querySelector("#app").innerHTML = `
  <div class="container">
    <h1>HitMagnet Thumbnail Collector</h1>
    <div id="signin-container"></div>
  </div>
`;

const signinContainer = document.querySelector("#signin-container");

signinContainer.appendChild(
  createButton(
    "signin-button",
    "Sign in with Google",
    () => {},
    "googleSignin",
    createImage(googleIcon, "google-icon")
  )
);
