/* eslint-env browser */
/* eslint-disable no-undef */
/** @env browser */

const secondsBeforeStatusCheck = 7;
const secondsBeforeAutoClose = 10;

function closeWindow() {
  window.close();

  // Fallback if window.close() doesn't work
  setTimeout(() => {
    window.location.href = "/";
  }, 1000);
}

async function checkVerificationStatus() {
  try {
    // Get email from URL parameters
    const urlParams = new URLSearchParams(window.location.search);

    const urlEmail = urlParams.get("email");
    const email = decodeURIComponent(urlEmail);
    
    if (!email) {
      throw new Error("Email not found in verification link or JWT token");
    }

    // Check verification status via the status endpoint
    const response = await fetch(
      `/api/auth/status?email=${encodeURIComponent(email)}`
    );
    const result = await response.json();

    if (result.success && result.data.verified) {
      showSuccess();
    } else if (result.success && !result.data.verified) {
      showError(
        "Email verification is still pending. Please check your email and click the verification link."
      );
    } else {
      showError(result.error || "Failed to check verification status");
    }
  } catch (error) {
    console.error("Status check error:", error);
    showError(error.message || "An unexpected error occurred");
  }
}

function showSuccess() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("success").style.display = "block";

  // Countdown and auto-close
  let countdown = secondsBeforeAutoClose;
  const countdownElement = document.getElementById("countdown");

  setInterval(() => {
    countdown--;
    countdownElement.textContent = countdown;

    if (countdown <= 0) {
      closeWindow();
    }
  }, 1000);
}

function showError(message) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("error").style.display = "block";
  document.getElementById("error-message").textContent = message;

  // Countdown and auto-close
  let countdown = secondsBeforeAutoClose;
  const countdownElement = document.getElementById("error-countdown");

  setInterval(() => {
    countdown--;
    countdownElement.textContent = countdown;

    if (countdown <= 0) {
      closeWindow();
    }

  }, 1000);
}

// Wait 7 seconds after page load, then check verification status
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(checkVerificationStatus, 1000 * secondsBeforeStatusCheck);
});

