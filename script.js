"use strict";

// Configure with the business WhatsApp number in international format, digits only.
// Leave empty to let customers choose a WhatsApp contact after opening the prefilled message.
const BUSINESS_WHATSAPP_NUMBER = "";
const DEFAULT_WHATSAPP_MESSAGE = "Hello Siva Sai Enterprises, I am interested in your tea and coffee products. Please share your wholesale prices and product details.";

const whatsappUrl = (message) => {
  const base = BUSINESS_WHATSAPP_NUMBER
    ? `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`
    : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
};

document.querySelectorAll('a[href^="https://wa.me/"]').forEach((link) => {
  link.href = whatsappUrl(DEFAULT_WHATSAPP_MESSAGE);
});

const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");
menuToggle.addEventListener("click", () => {
  const isOpen = primaryNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});
primaryNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  primaryNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
}));

const productCards = [...document.querySelectorAll(".product-card")];
const searchInput = document.querySelector("#product-search");
const noResults = document.querySelector("#no-results");
let activeFilter = "all";

function filterProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  let visibleCount = 0;
  productCards.forEach((card) => {
    const matchesCategory = activeFilter === "all" ||
      card.dataset.category === activeFilter ||
      (activeFilter === "tea" && card.dataset.category === "green");
    const matchesSearch = card.dataset.name.toLocaleLowerCase().includes(query);
    card.hidden = !(matchesCategory && matchesSearch);
    if (!card.hidden) visibleCount += 1;
  });
  noResults.hidden = visibleCount > 0;
}

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((filterButton) => {
      const selected = filterButton === button;
      filterButton.classList.toggle("active", selected);
      filterButton.setAttribute("aria-pressed", String(selected));
    });
    filterProducts();
  });
});
searchInput.addEventListener("input", filterProducts);

const enquiryForm = document.querySelector("#enquiry-form");
const formStatus = document.querySelector("#form-status");
enquiryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!enquiryForm.reportValidity()) return;
  const data = new FormData(enquiryForm);
  const details = [
    "Hello Siva Sai Enterprises, I am interested in your tea and coffee products.",
    "",
    `Customer name: ${data.get("customerName")}`,
    `Business name: ${data.get("businessName") || "Not provided"}`,
    `Phone number: ${data.get("phone")}`,
    `Product required: ${data.get("product") || "Please suggest"}`,
    `Required quantity: ${data.get("quantity") || "To be discussed"}`,
    `Message: ${data.get("message") || "Please share your wholesale prices and product details."}`
  ];
  formStatus.textContent = "Your enquiry is ready in WhatsApp. Please send it there to reach us.";
  window.open(whatsappUrl(details.join("\n")), "_blank", "noopener,noreferrer");
});

document.querySelectorAll("[data-product]").forEach((button) => {
  button.addEventListener("click", () => {
    const product = button.dataset.product;
    document.querySelector("#enquiry-form select[name='product']").value = product;
    document.querySelector("#enquiry").scrollIntoView({ behavior: "smooth" });
    document.querySelector("#enquiry-form input[name='customerName']").focus({ preventScroll: true });
  });
});
document.querySelectorAll("[data-product-link]").forEach((link) => {
  link.addEventListener("click", () => {
    const product = link.dataset.productLink;
    document.querySelector("#enquiry-form select[name='product']").value = product;
  });
});

const assistantPanel = document.querySelector("#assistant-panel");
const assistantLauncher = document.querySelector("#assistant-launcher");
const assistantClose = document.querySelector(".assistant-close");
const assistantMessages = document.querySelector("#assistant-messages");
const assistantForm = document.querySelector("#assistant-form");
const assistantText = document.querySelector("#assistant-text");

function setAssistantOpen(open) {
  assistantPanel.hidden = !open;
  assistantLauncher.setAttribute("aria-expanded", String(open));
  if (open) assistantText.focus();
}
assistantLauncher.addEventListener("click", () => setAssistantOpen(assistantPanel.hidden));
assistantClose.addEventListener("click", () => setAssistantOpen(false));

function addAssistantMessage(text, isUser) {
  const message = document.createElement("div");
  message.className = isUser ? "user-message" : "bot-message";
  message.textContent = text;
  assistantMessages.append(message);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

function answerAssistant(reply) {
  const normalized = reply.toLocaleLowerCase();
  addAssistantMessage(reply, true);
  let response = "Thanks for your message! Our team can help with product availability and current pricing. Please send us an enquiry and we’ll take it from there.";
  if (normalized.includes("product") || normalized.includes("tea") || normalized.includes("coffee")) {
    response = "We stock Assam CTC, Assam leaf, green and mint green teas, Nilgiri tea, black tea and coffee powder. Explore the selection for details, then enquire about current availability.";
    document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
  } else if (normalized.includes("wholesale") || normalized.includes("price") || normalized.includes("bulk")) {
    response = "We welcome tea shop, hotel, supermarket, grocery, retailer, distributor and bulk enquiries. Wholesale prices depend on quantity, packaging and availability.";
    document.querySelector("#wholesale").scrollIntoView({ behavior: "smooth" });
  } else if (normalized.includes("location") || normalized.includes("address") || normalized.includes("map")) {
    response = "You’ll find us at Mangalavaripeta / T. Nagar, Beside SBI, Rajahmundry, Andhra Pradesh. The contact section has a map and directions.";
    document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
  } else if (normalized.includes("feedback")) {
    response = "We’d love to hear your feedback. Leave a note in the enquiry form and we’ll be glad to receive it.";
    document.querySelector("#enquiry-form select[name='product']").value = "Feedback / suggestion";
    document.querySelector("#enquiry").scrollIntoView({ behavior: "smooth" });
  } else if (normalized.includes("hello") || normalized.includes("namaste") || normalized.includes("hi")) {
    response = "Namaste! What can I help you find — our products, wholesale pricing or our Rajahmundry location?";
  }
  window.setTimeout(() => addAssistantMessage(response, false), 300);
}

document.querySelectorAll(".assistant-choices button").forEach((button) => {
  button.addEventListener("click", () => {
    const replies = {
      products: "I’d like to explore your tea and coffee products.",
      wholesale: "I’m interested in wholesale pricing.",
      location: "Where are you located?",
      feedback: "I’d like to share feedback."
    };
    answerAssistant(replies[button.dataset.reply]);
  });
});
assistantForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = assistantText.value.trim();
  if (!text) return;
  assistantText.value = "";
  answerAssistant(text);
});

document.querySelector("#current-year").textContent = String(new Date().getFullYear());
