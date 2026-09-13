"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("codoraDesktop", {
  isDesktop: true,
  runJava: (code, input) => ipcRenderer.invoke("java:run", { code, input }),
  runCpp: (code, input) => ipcRenderer.invoke("cpp:run", { code, input }),
});