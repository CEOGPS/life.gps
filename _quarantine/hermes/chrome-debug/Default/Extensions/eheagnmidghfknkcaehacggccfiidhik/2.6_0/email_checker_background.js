"use strict";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "showPopup",
    title: "Check email '%s'",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) =>
{
  console.log('if (info.menuItemId === "showPopup"', info, tab);

  if (info.menuItemId === "showPopup")
  {
    if (info.selectionText)
    {
      // Store the selected text
      chrome.storage.local.set({ selectedText: info.selectionText }, () => {
        // Open the popup
        //chrome.action.openPopup();

  chrome.windows.create({
    url: chrome.runtime.getURL("email_checker_popup.html?popup=1"),
    type: "popup",
    width: 550,
    height: 450
  });

      });
    }
  }
});


/*chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getSelectedTextAndAlert
  });
});*/

function getSelectedTextAndAlert() {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    alert("Selected Text: " + selectedText);
  } else {
    alert("No text selected. Please highlight text first.");
  }
}


/*chrome.action.onClicked.addListener(()=>
{
  chrome.tabs.create({url:chrome.runtime.getURL('./index.html')})
});*/

chrome.runtime.onInstalled.addListener((details) =>
{
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL)
  {
    // Code to be executed on first install
    // eg. open a tab with a url
    chrome.tabs.create({
      url: "https://email-checker.pro/welcome",
    });
  }
  else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE)
  {
    // When extension is updated
  }
  else if (details.reason === chrome.runtime.OnInstalledReason.CHROME_UPDATE)
  {
    // When browser is updated
  }
  else if (details.reason === chrome.runtime.OnInstalledReason.SHARED_MODULE_UPDATE)
  {
    // When a shared module is updated
  }
});

const UNINSTALL_URL = "https://email-checker.pro/uninstall";
chrome.runtime.setUninstallURL(UNINSTALL_URL);

