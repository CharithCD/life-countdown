document.getElementById("openNewTab").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://newtab" });
});
