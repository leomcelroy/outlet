import { createListener } from "../utils/createListener.js";

export function addDropUpload(callback, ops = {}) {
  ops.extensions ||= [];

  const dropScreen = document.createElement("div");
  dropScreen.className =
    "data-[hidden]:hidden fixed top-0 left-0 w-full h-full bg-gray-700 bg-opacity-50 flex items-center justify-center";
  dropScreen.innerHTML = `
    <h2 class="text-2xl text-white">Drop your ".sketch.json" files here!</h2>
  `;
  dropScreen.setAttribute("data-hidden", "");

  document.body.appendChild(dropScreen);

  const listener = createListener(document.body);

  // add drop modal

  listener("drop", "", function (evt) {
    if (evt.dataTransfer.types.includes("application/x-layer")) {
      return;
    }
    let dt = evt.dataTransfer;
    let files = dt.files;

    dropScreen.setAttribute("data-hidden", "");

    upload(files, callback, ops);

    pauseEvent(evt);
  });

  listener("dragover", "", function (evt) {
    // Check if this is a layer being dragged
    if (evt.dataTransfer.types.includes("application/x-layer")) {
      return;
    }
    dropScreen.removeAttribute("data-hidden");
    pauseEvent(evt);
  });

  listener("mouseleave", "", function (evt) {
    // document.querySelector(".drop-modal").style.display = "none";
  });
}

function upload(files, callback, ops) {
  const file = files[0];
  const fileName = file.name.split(".");
  const name = fileName[0];
  const extension = fileName[fileName.length - 1];

  var reader = new FileReader();
  reader.readAsText(file);

  reader.onloadend = (event) => {
    let text = reader.result;

    if (ops.extensions.length !== 0 && !ops.extensions.includes(extension)) {
      throw Error("Unknown extension:", extension);
    } else {
      callback(text);
    }
  };
}

function pauseEvent(e) {
  if (e.stopPropagation) e.stopPropagation();
  if (e.preventDefault) e.preventDefault();
  e.cancelBubble = true;
  e.returnValue = false;
  return false;
}
