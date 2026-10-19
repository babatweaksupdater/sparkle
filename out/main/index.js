"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const path = require("path");
const log = require("electron-log");
const fs = require("fs");
const util = require("util");
const child_process = require("child_process");
const os = require("os");
const si = require("systeminformation");
const fs$1 = require("fs/promises");
const crypto = require("crypto");
const electronUpdater = require("electron-updater");
const Store = require("electron-store");
const discordRpcNew = require("discord-rpc-new");
const is = {
  dev: electron.app.isPackaged === false ? true : false
};
const getResourcePath = (fileName) => {
  if (is.dev) {
    return path.resolve(process.cwd(), "resources", fileName);
  }
  return path.join(process.resourcesPath, fileName);
};
function createTray(mainWindow2) {
  const tray = new electron.Tray(getResourcePath("sparkle2.ico"));
  const contextMenu = electron.Menu.buildFromTemplate([
    { label: "Open Window", click: () => mainWindow2.show() },
    { label: "Quit", click: () => electron.app.quit() }
  ]);
  tray.setToolTip("Sparkle Optimizer");
  tray.setTitle("Sparkle Optimizer");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => ToggleWindowState(mainWindow2));
  return tray;
}
function ToggleWindowState(mainWindow2) {
  mainWindow2.isVisible() ? mainWindow2.hide() : mainWindow2.show();
}
const logo = "[Sparkle]:";
let mainWindow$1 = null;
function setMainWindow(win) {
  mainWindow$1 = win;
}
const execPromise = util.promisify(child_process.exec);
console.log = log.log;
console.error = log.error;
console.warn = log.warn;
function isSafeId(id) {
  return /^[a-zA-Z0-9._-]+$/.test(id);
}
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
async function executePowerShell(props) {
  const { script, name = "script", output = true } = props;
  try {
    const tempDir = path.join(electron.app.getPath("userData"), "scripts");
    ensureDirectoryExists(tempDir);
    const tempFile = path.join(tempDir, `${name}-${Date.now()}.ps1`);
    await fs.promises.writeFile(tempFile, script);
    const { stdout, stderr } = await execPromise(
      `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${tempFile}"`
    );
    await fs.promises.unlink(tempFile).catch(console.error);
    if (stderr) {
      console.warn(`PowerShell stderr [${name}]:`, stderr);
    }
    if (output == true) {
      console.log(`PowerShell stdout [${name}]:`, stdout);
    }
    return { success: true, output: stdout };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`PowerShell execution error [${name}]:`, error);
    return { success: false, error: message };
  }
}
function sendToRenderer(channel, ...args) {
  if (mainWindow$1 && !mainWindow$1.isDestroyed()) {
    mainWindow$1.webContents.send(channel, ...args);
  }
}
function sendOutput(appId, text) {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim()) {
      sendToRenderer("install-output", { appId, line });
    }
  }
}
function executePowerShellStreaming(props) {
  const { script, name = "script", appId } = props;
  return new Promise(async (resolve) => {
    const tempDir = path.join(electron.app.getPath("userData"), "scripts");
    ensureDirectoryExists(tempDir);
    const tempFile = path.join(tempDir, `${name}-${Date.now()}.ps1`);
    await fs.promises.writeFile(tempFile, script);
    let fullOutput = "";
    const child = child_process.spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      tempFile
    ]);
    child.stdout?.on("data", (data) => {
      const text = data.toString();
      fullOutput += text;
      sendOutput(appId, text);
    });
    child.stderr?.on("data", (data) => {
      const text = data.toString();
      fullOutput += text;
      sendOutput(appId, text);
    });
    child.on("close", async (code) => {
      await fs.promises.unlink(tempFile).catch(console.error);
      if (code === 0) {
        console.log(`PowerShell stdout [${name}]:`, fullOutput);
        resolve({ success: true, output: fullOutput });
      } else {
        console.error(`PowerShell execution error [${name}]: Exit code ${code}`);
        resolve({ success: false, error: `Process exited with code ${code}`, output: fullOutput });
      }
    });
    child.on("error", async (error) => {
      await fs.promises.unlink(tempFile).catch(console.error);
      console.error(`PowerShell spawn error [${name}]:`, error);
      resolve({ success: false, error: error.message });
    });
  });
}
async function runPowerShellInWindow(props) {
  const { script, name = "script", noExit = true } = props;
  try {
    const tempDir = path.join(electron.app.getPath("userData"), "scripts");
    ensureDirectoryExists(tempDir);
    const tempFile = path.join(tempDir, `${name}-${Date.now()}.ps1`);
    await fs.promises.writeFile(tempFile, script);
    const noExitFlag = noExit ? "-NoExit" : "";
    const command = `start powershell.exe ${noExitFlag} -ExecutionPolicy Bypass -File "${tempFile}"`;
    child_process.exec(command, (error) => {
      if (error) {
        console.error(`Error launching PowerShell window [${name}]:`, error);
      }
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error in runPowerShellInWindow [${name}]:`, error);
    return { success: false, error: message };
  }
}
async function checkChocolatey() {
  try {
    const chocoPath = path.join("C:\\ProgramData\\chocolatey\\bin\\choco.exe");
    const installed = fs.existsSync(chocoPath);
    if (installed) {
      console.log("Chocolatey is installed:", chocoPath);
    } else {
      console.log("Chocolatey is not installed");
    }
    return { success: true, installed };
  } catch (error) {
    console.error("Error checking Chocolatey installation:", error);
    return { success: false, installed: false };
  }
}
const setupPowerShellHandlers = () => {
  electron.ipcMain.handle(
    "run-powershell-window",
    (_event, props) => runPowerShellInWindow(props)
  );
  electron.ipcMain.handle(
    "run-powershell",
    (_event, props) => executePowerShell(props)
  );
  electron.ipcMain.handle("check-chocolatey", async () => checkChocolatey());
  electron.ipcMain.handle("install-chocolatey", async () => {
    try {
      const result = await executePowerShell({
        script: "winget install --id chocolatey.chocolatey --source winget",
        name: "install-chocolatey"
      });
      if (result.success) {
        return { installed: true, version: result.output?.trim() ?? "" };
      } else {
        return { installed: false };
      }
    } catch (error) {
      console.error("Error installing Chocolatey:", error);
      return { installed: false };
    }
  });
  electron.ipcMain.handle("handle-apps", async (_event, { action, apps, source }) => {
    switch (action) {
      case "install":
        for (const appId of apps) {
          if (!isSafeId(appId)) {
            console.error(`Rejected unsafe app ID: ${appId}`);
            sendToRenderer("install-app-error", { appId });
            continue;
          }
          let command;
          if (source === "Chocolatey") {
            command = `choco install ${appId} -y`;
          } else {
            command = `winget install ${appId} --silent --accept-package-agreements --accept-source-agreements`;
          }
          sendToRenderer("install-start", { appId });
          const result = await executePowerShellStreaming({
            script: command,
            name: `Install-${appId}`,
            appId
          });
          const isChocoFailure = source === "Chocolatey" && !result.success && result.output && !result.output.includes("already installed");
          if (result.success || result.output && result.output.includes("already installed")) {
            console.log(`Successfully installed ${appId}`);
            sendToRenderer("install-app-complete", { appId });
          } else if (isChocoFailure) {
            console.log(`Initial install failed for ${appId}, retrying with --pre flag`);
            sendToRenderer("install-output", { appId, line: "\nRetrying with --pre flag...\n" });
            const retryCommand = `choco install ${appId} -y --pre`;
            const retryResult = await executePowerShellStreaming({
              script: retryCommand,
              name: `Install-${appId}-pre`,
              appId
            });
            if (retryResult.success || retryResult.output && retryResult.output.includes("already installed")) {
              console.log(`Successfully installed ${appId} with --pre flag`);
              sendToRenderer("install-app-complete", { appId });
            } else {
              console.error(`Failed to install ${appId} even with --pre flag:`, retryResult.error);
              sendToRenderer("install-app-error", { appId });
            }
          } else {
            console.error(`Failed to install ${appId}:`, result.error);
            sendToRenderer("install-app-error", { appId });
          }
        }
        sendToRenderer("install-complete");
        break;
      case "uninstall":
        for (const appId of apps) {
          if (!isSafeId(appId)) {
            console.error(`Rejected unsafe app ID: ${appId}`);
            sendToRenderer("install-app-error", { appId });
            continue;
          }
          let command;
          if (source === "Chocolatey") {
            command = `choco uninstall ${appId} -y`;
          } else {
            command = `winget uninstall ${appId} --silent`;
          }
          sendToRenderer("install-start", { appId });
          const result = await executePowerShellStreaming({
            script: command,
            name: `Uninstall-${appId}`,
            appId
          });
          if (result.success) {
            console.log(`Successfully uninstalled ${appId}`);
            sendToRenderer("install-app-complete", { appId });
          } else {
            console.error(`Failed to uninstall ${appId}:`, result.error);
            sendToRenderer("install-app-error", { appId });
          }
        }
        sendToRenderer("install-complete");
        break;
      case "check-installed":
        try {
          const result = await executePowerShell({
            script: "winget list",
            name: "check-installed"
          });
          if (!result.success) {
            throw new Error(result.error);
          }
          const escapeRegExp = (string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          };
          const installedAppIds = apps.filter((appId) => {
            const regex = new RegExp(`\\b${escapeRegExp(appId)}\\b`, "i");
            return regex.test(result.output ?? "");
          });
          if (mainWindow$1) {
            mainWindow$1.webContents.send("installed-apps-checked", {
              success: true,
              installed: installedAppIds
            });
          }
        } catch (error) {
          console.error("Failed to check installed apps:", error);
          if (mainWindow$1) {
            mainWindow$1.webContents.send("installed-apps-checked", {
              success: false,
              error: error.message
            });
          }
        }
        break;
      default:
        console.error(`Unknown action: ${action}`);
    }
  });
  console.log("[Sparkle main/powershell.ts]: PowerShell handlers setup complete");
};
class TtlCache {
  cache = /* @__PURE__ */ new Map();
  defaultTtlMs;
  constructor(defaultTtlMs = 5 * 60 * 1e3) {
    this.defaultTtlMs = defaultTtlMs;
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return void 0;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return void 0;
    }
    return entry.value;
  }
  set(key, value, ttlMs) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs)
    });
  }
  delete(key) {
    this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
}
console.log = log.log;
console.error = log.error;
console.warn = log.warn;
const gpuCache = new TtlCache(5 * 60 * 1e3);
function isIntegratedController(model) {
  const m = model.toLowerCase();
  return m.includes("integrated") || m.includes("intel") && (m.includes("hd") || m.includes("uhd") || m.includes("iris")) || m.includes("amd") && m.includes("radeon") && m.includes("graphics") || m.includes("amd") && m.includes("vega") && !m.includes("rx") || m.includes("intel graphics");
}
function isDedicatedController(model) {
  const m = model.toLowerCase();
  return !isIntegratedController(m) && (m.includes("nvidia") || m.includes("amd") && (m.includes("radeon") || m.includes("rx") || m.includes("vega") || m.includes("firepro") || m.includes("instinct")) || m.includes("intel") && m.includes("arc"));
}
async function detectGPU() {
  const cached = gpuCache.get("gpu");
  if (cached) return cached;
  const defaults = {
    model: "GPU not found",
    vram: "N/A",
    hasGPU: false,
    isNvidia: false,
    integratedModel: "Not detected",
    hasIntegratedGPU: false
  };
  try {
    const graphicsData = await si.graphics();
    if (!graphicsData.controllers || graphicsData.controllers.length === 0) {
      gpuCache.set("gpu", defaults);
      return defaults;
    }
    const integratedControllers = graphicsData.controllers.filter(
      (c) => isIntegratedController(c.model || "")
    );
    const dedicatedControllers = graphicsData.controllers.filter(
      (c) => isDedicatedController(c.model || "")
    );
    const dedicatedGPU = dedicatedControllers.sort(
      (a, b) => (b.vram || 0) - (a.vram || 0)
    )[0];
    const integratedGPU = integratedControllers.sort(
      (a, b) => (b.vram || 0) - (a.vram || 0)
    )[0];
    const result = { ...defaults };
    if (integratedGPU) {
      result.integratedModel = integratedGPU.model || "Unknown Integrated GPU";
      result.hasIntegratedGPU = true;
    }
    if (dedicatedGPU) {
      result.model = dedicatedGPU.model || "Unknown GPU";
      result.vram = dedicatedGPU.vram ? `${Math.round(dedicatedGPU.vram / 1024)} GB` : "Unknown";
      result.hasGPU = true;
      result.isNvidia = dedicatedGPU.model.toLowerCase().includes("nvidia");
    }
    gpuCache.set("gpu", result);
    return result;
  } catch (error) {
    console.error("Error detecting GPU:", error);
    gpuCache.set("gpu", defaults);
    return defaults;
  }
}
function clearGpuCache() {
  gpuCache.clear();
}
const systemInfoCache = new TtlCache(5 * 60 * 1e3);
const execFilePromise = util.promisify(child_process.execFile);
console.log = log.log;
console.error = log.error;
console.warn = log.warn;
async function getSystemInfo() {
  const cached = systemInfoCache.get("systemInfo");
  if (cached) return cached;
  try {
    const [cpuData, osInfo, memLayout] = await Promise.all([
      si.cpu(),
      si.osInfo(),
      si.memLayout()
    ]);
    const totalMemory = os.totalmem();
    const memoryType = memLayout.length > 0 ? memLayout[0].type : "Unknown";
    const versionScript = `(Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion").DisplayVersion`;
    const versionPsResult = await executePowerShell({
      script: versionScript,
      name: "GetWindowsVersion"
    });
    const windowsVersion = versionPsResult.success ? versionPsResult.output.trim() : "Unknown";
    const result = {
      cpu_model: cpuData.brand,
      cpu_cores: cpuData.physicalCores,
      cpu_threads: cpuData.threads || cpuData.physicalCores,
      memory_total: totalMemory,
      memory_type: memoryType,
      os: osInfo.distro || "Windows",
      os_version: windowsVersion || "Unknown"
    };
    setImmediate(async () => {
      detectGPU().then((gpuInfo) => {
        mainWindow$1?.webContents.send("system-info-extra", {
          gpu_model: gpuInfo.model,
          vram: gpuInfo.vram,
          hasGPU: gpuInfo.hasGPU,
          isNvidia: gpuInfo.isNvidia,
          integrated_gpu: gpuInfo.integratedModel,
          hasIntegratedGPU: gpuInfo.hasIntegratedGPU
        });
      }).catch((error) => {
        console.error("Failed to detect GPU:", error);
      });
      try {
        const [diskLayout, fsSize, blockDevices] = await Promise.all([
          si.diskLayout(),
          si.fsSize(),
          si.blockDevices()
        ]);
        const cDrive = fsSize.find(
          (d) => d.mount.toUpperCase().startsWith("C:")
        );
        let primaryDisk = null;
        if (cDrive) {
          const cBlock = blockDevices.find(
            (b) => b.mount && b.mount.toUpperCase().startsWith("C:")
          );
          if (cBlock) {
            primaryDisk = diskLayout.find(
              (disk) => disk.device?.toLowerCase() === cBlock.device?.toLowerCase() || disk.name?.toLowerCase().includes(cBlock.name?.toLowerCase())
            ) || null;
          }
        }
        mainWindow$1?.webContents.send("system-info-extra", {
          disk_model: primaryDisk?.name || primaryDisk?.device || "Unknown Storage",
          disk_size: cDrive?.size ? `${Math.round(cDrive.size / 1024 / 1024 / 1024).toFixed(1)} GB` : "Unknown"
        });
      } catch (error) {
        console.error("Failed to fetch disk info:", error);
      }
    });
    systemInfoCache.set("systemInfo", result);
    return result;
  } catch (error) {
    console.error("Failed to get system info:", error);
    throw error;
  }
}
function restartSystem() {
  try {
    child_process.exec("shutdown /r /t 0");
    return { success: true };
  } catch (error) {
    console.error("Failed to restart system:", error);
    throw error;
  }
}
function restartExplorer() {
  try {
    child_process.exec("taskkill /f /im explorer.exe & start explorer.exe");
    return { success: true };
  } catch (error) {
    console.error("Failed to restart explorer:", error);
    return { success: false, error: error.message };
  }
}
function getUserName() {
  return os.userInfo().username;
}
async function getAdminStatus() {
  console.log("[Sparkle]: Checking admin status...");
  try {
    const { execSync } = await import("child_process");
    execSync("net session", { stdio: "pipe" });
    console.log("[Sparkle]: Admin status: true");
    return true;
  } catch (error) {
    console.log("[Sparkle]: Not running as admin");
    return false;
  }
}
function clearSparkleCache() {
  systemInfoCache.clear();
  clearGpuCache();
  try {
    const userDataPath2 = electron.app.getPath("userData");
    const scriptsPath = path.join(userDataPath2, "scripts");
    const logsPath = path.join(userDataPath2, "logs");
    let scriptsCleared = false;
    let logsCleared = false;
    let errors = [];
    if (fs.existsSync(scriptsPath)) {
      const files = fs.readdirSync(scriptsPath);
      for (const file of files) {
        const filePath = path.join(scriptsPath, file);
        try {
          if (fs.lstatSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          errors.push(`Failed to delete script file: ${file} - ${err.message}`);
        }
      }
      scriptsCleared = true;
      console.log("Sparkle scripts directory files cleared successfully.");
    } else {
      console.warn("Sparkle scripts directory does not exist.");
      errors.push("Scripts directory does not exist.");
    }
    if (fs.existsSync(logsPath)) {
      const logFiles = fs.readdirSync(logsPath);
      for (const file of logFiles) {
        const filePath = path.join(logsPath, file);
        try {
          if (fs.lstatSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          errors.push(`Failed to delete log file: ${file} - ${err.message}`);
        }
      }
      logsCleared = true;
      console.log("Sparkle logs directory files cleared successfully.");
    } else {
      console.warn("Sparkle logs directory does not exist.");
      errors.push("Logs directory does not exist.");
    }
    if (errors.length === 0) {
      return { success: true };
    } else {
      return {
        success: scriptsCleared || logsCleared,
        error: errors.join(" | ")
      };
    }
  } catch (error) {
    console.error("Failed to clear Sparkle scripts or logs directory:", error);
    return { success: false, error: error.message };
  }
}
function openLogFolder() {
  const logPath = path.join(electron.app.getPath("userData"), "logs");
  if (fs.existsSync(logPath)) {
    electron.shell.openPath(logPath);
    return { success: true };
  } else {
    console.warn("Sparkle logs directory does not exist.");
    return { success: false, error: "Logs directory does not exist." };
  }
}
const ensureWingetScript = `
$TestMode = $false  # Set $true to force winget install for testing

function Check-Winget {
    try {
        $null = winget --version 2>&1
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Show-InstallerGUI {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $form = New-Object System.Windows.Forms.Form
    $form.Text = "Sparkle: Winget Installer"
    $form.Size = New-Object System.Drawing.Size(600,400)
    $form.StartPosition = "CenterScreen"

    $label = New-Object System.Windows.Forms.Label
    $label.Text = "Welcome! Sparkle needs Winget to install apps."
    $label.AutoSize = $true
    $label.Location = New-Object System.Drawing.Point(20,20)
    $form.Controls.Add($label)

    $outputBox = New-Object System.Windows.Forms.TextBox
    $outputBox.Multiline = $true
    $outputBox.ScrollBars = 'Vertical'
    $outputBox.ReadOnly = $true
    $outputBox.Size = New-Object System.Drawing.Size(550,250)
    $outputBox.Location = New-Object System.Drawing.Point(20,60)
    $form.Controls.Add($outputBox)

    $closeButton = New-Object System.Windows.Forms.Button
    $closeButton.Text = "Close"
    $closeButton.Size = New-Object System.Drawing.Size(100,30)
    $closeButton.Location = New-Object System.Drawing.Point(240,320)
    $closeButton.Enabled = $false
    $closeButton.Add_Click({ $form.Close() })
    $form.Controls.Add($closeButton)

    function Append-Output {
        param($text)
        $outputBox.AppendText("$text\`r\`n")
        $outputBox.SelectionStart = $outputBox.Text.Length
        $outputBox.ScrollToCaret()
        [System.Windows.Forms.Application]::DoEvents()
    }

    # Create a runspace for background work
    $runspace = [runspacefactory]::CreateRunspace()
    $runspace.ApartmentState = "STA"
    $runspace.ThreadOptions = "ReuseThread"
    $runspace.Open()
    $runspace.SessionStateProxy.SetVariable("TestMode", $TestMode)

    $powershell = [powershell]::Create()
    $powershell.Runspace = $runspace

    [void]$powershell.AddScript({
        function Check-Winget {
            try {
                $null = winget --version 2>&1
                return $LASTEXITCODE -eq 0
            } catch {
                return $false
            }
        }

        $result = @{
            Success = $false
            Messages = @()
        }

        try {
            $result.Messages += "Checking for Winget..."
            $wingetInstalled = Check-Winget

            if ($TestMode -or -not $wingetInstalled) {
                $result.Messages += "Winget not found. Installing for Sparkle..."
                
                try {
                    $result.Messages += "Attempting to register App Installer..."
                    
                    # Add timeout wrapper for AppX operations
                    $job = Start-Job -ScriptBlock {
                        Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe
                    }
                    
                    $completed = Wait-Job -Job $job -Timeout 60
                    if ($completed) {
                        Receive-Job -Job $job
                        Remove-Job -Job $job
                    } else {
                        Remove-Job -Job $job -Force
                        throw "Registration timed out after 60 seconds"
                    }
                    
                    Start-Sleep -Seconds 2
                    
                    if (Check-Winget) {
                        $result.Messages += "Winget installed successfully!"
                        $result.Success = $true
                    } else {
                        throw "Registration completed but winget not found"
                    }
                } catch {
                    $result.Messages += "Registration method failed: $($_.Exception.Message)"
                    $result.Messages += "Trying download method..."
                    
                    try {
                        $result.Messages += "Downloading latest App Installer package..."
                        $progressPreference = 'SilentlyContinue'
                        
                        # Add timeout to web requests
                        $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/microsoft/winget-cli/releases/latest" -TimeoutSec 30
                        $downloadUrl = ($releases.assets | Where-Object { $_.name -like "*.msixbundle" }).browser_download_url
                        
                        if (-not $downloadUrl) {
                            throw "Could not find download URL in GitHub release"
                        }
                        
                        $tempFile = Join-Path $env:TEMP "Microsoft.DesktopAppInstaller.msixbundle"
                        
                        $result.Messages += "Downloading from GitHub..."
                        Start-BitsTransfer -Source $downloadUrl -Destination $tempFile -TimeoutSec 120
                        
                        $result.Messages += "Installing package (this may take a minute)..."
                        
                        # Add timeout wrapper for installation
                        $job = Start-Job -ScriptBlock {
                            param($path)
                            Add-AppxPackage -Path $path
                        } -ArgumentList $tempFile
                        
                        $completed = Wait-Job -Job $job -Timeout 120
                        if ($completed) {
                            Receive-Job -Job $job
                            Remove-Job -Job $job
                        } else {
                            Remove-Job -Job $job -Force
                            throw "Installation timed out after 120 seconds"
                        }
                        
                        # Clean up
                        if (Test-Path $tempFile) {
                            Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
                        }
                        
                        Start-Sleep -Seconds 2
                        
                        if (Check-Winget) {
                            $result.Messages += "Winget installed successfully!"
                            $result.Success = $true
                        } else {
                            $result.Messages += "WARNING: Installation completed but winget command not available yet."
                            $result.Messages += "You may need to restart your terminal or computer."
                            $result.Success = $false
                        }
                    } catch {
                        $result.Messages += "ERROR: Failed to install Winget."
                        $result.Messages += $_.Exception.Message
                        $result.Messages += ""
                        $result.Messages += "Manual installation: Visit https://aka.ms/getwinget"
                        $result.Success = $false
                    }
                }
            } else {
                $result.Messages += "Winget is already installed. Sparkle is ready to install apps!"
                $result.Success = $true
            }
        } catch {
            $result.Messages += "ERROR: Unexpected error occurred."
            $result.Messages += $_.Exception.Message
            $result.Success = $false
        }

        return $result
    })

    $handle = $powershell.BeginInvoke()

    # Poll for completion
    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 500
    $timer.Add_Tick({
        if ($handle.IsCompleted) {
            $timer.Stop()
            
            try {
                $result = $powershell.EndInvoke($handle)
                
                foreach ($message in $result.Messages) {
                    Append-Output $message
                }
                
                Append-Output ""
                Append-Output "You can now close this window."
            } catch {
                Append-Output "ERROR: Installation process failed."
                Append-Output $_.Exception.Message
            } finally {
                $closeButton.Enabled = $true
                $powershell.Dispose()
                $runspace.Close()
            }
        }
    })

    $form.Add_Shown({ $timer.Start() })
    
    # Clean up on form close
    $form.Add_FormClosing({
        if (-not $handle.IsCompleted) {
            $powershell.Stop()
        }
        $timer.Stop()
        $powershell.Dispose()
        $runspace.Close()
    })

    [void]$form.ShowDialog()
}

# --- Main Execution ---
if ($TestMode -or -not (Check-Winget)) {
    Show-InstallerGUI
} else {
    Write-Output "Winget is already installed. Sparkle can install apps!"
}
`;
function ensureWinget() {
  return executePowerShell({
    script: ensureWingetScript,
    name: "Ensure-Winget"
  });
}
async function checkWinget() {
  try {
    await execFilePromise("winget", ["--version"]);
    console.log("Winget is installed");
    return { success: true, installed: true };
  } catch {
    console.log("Winget is not installed");
    return { success: true, installed: false };
  }
}
const setupSystemHandlers = () => {
  electron.ipcMain.handle("restart", restartSystem);
  electron.ipcMain.handle("open-log-folder", openLogFolder);
  electron.ipcMain.handle("clear-sparkle-cache", clearSparkleCache);
  electron.ipcMain.handle("baba:get-hwid", async () => {
    try {
      if (process.platform !== "win32") return null;
      const result = child_process.execFileSync("reg.exe", ["query", "HKLM\\SOFTWARE\\Microsoft\\Cryptography", "/v", "MachineGuid"], { encoding: "utf8", windowsHide: true });
      const match = result.match(/MachineGuid\s+REG_SZ\s+([^\r\n]+)/i);
      if (!match) return null;
      return crypto.createHash("sha256").update(match[1].trim().toUpperCase()).digest("hex");
    } catch (error) {
      console.error("Unable to read Windows device ID:", error);
      return null;
    }
  });
  electron.ipcMain.handle("baba:save-key", async (_event, key) => {
    try {
      if (typeof key !== "string" || !key.trim() || !electron.safeStorage.isEncryptionAvailable()) return false;
      const encrypted = electron.safeStorage.encryptString(key.trim());
      fs.writeFileSync(path.join(electron.app.getPath("userData"), "baba-saved-key.dat"), encrypted);
      return true;
    } catch (error) {
      console.error("Unable to save activation key:", error);
      return false;
    }
  });
  electron.ipcMain.handle("baba:get-saved-key", async () => {
    try {
      const savedPath = path.join(electron.app.getPath("userData"), "baba-saved-key.dat");
      if (!fs.existsSync(savedPath) || !electron.safeStorage.isEncryptionAvailable()) return null;
      return electron.safeStorage.decryptString(fs.readFileSync(savedPath));
    } catch (error) {
      console.error("Unable to read saved activation key:", error);
      return null;
    }
  });
  electron.ipcMain.handle("get-system-info", getSystemInfo);
  electron.ipcMain.handle("get-user-name", getUserName);
  electron.ipcMain.handle("restart-explorer", restartExplorer);
  electron.ipcMain.handle("check-winget", async () => checkWinget());
  electron.ipcMain.handle("get-admin-status", async () => getAdminStatus());
  electron.ipcMain.handle("install-winget", ensureWinget);
  console.log("[Sparkle main/system.ts]: System handlers setup complete");
};
console.log = log.log;
console.error = log.error;
console.warn = log.warn;
const userDataPath = electron.app.getPath("userData");
const tweaksStatePath = path.join(userDataPath, "tweakStates.json");
const isDev = !electron.app.isPackaged;
const tweaksDir = isDev ? path.join(process.cwd(), "tweaks") : path.join(electron.app.getAppPath(), "tweaks");
const getExePath = (exeName) => {
  if (isDev) {
    return path.resolve(process.cwd(), "resources", exeName);
  }
  return path.join(process.resourcesPath, exeName);
};
async function loadTweaks() {
  const entries = await fs$1.readdir(tweaksDir, { withFileTypes: true });
  const tweaks = [];
  for (const dir of entries) {
    if (!dir.isDirectory()) continue;
    const name = dir.name;
    const folder = path.join(tweaksDir, name);
    const applyPath = path.join(folder, "apply.ps1");
    const metaPath = path.join(folder, "meta.json");
    const hasMeta = await fs$1.access(metaPath).then(() => true).catch(() => false);
    if (!hasMeta) continue;
    const unapplyPath = path.join(folder, "unapply.ps1");
    let psapply = "";
    let psunapply = "";
    try {
      psapply = await fs$1.readFile(applyPath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.warn(`Error reading apply.ps1 for tweak: ${name}`, error);
      }
    }
    try {
      psunapply = await fs$1.readFile(unapplyPath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.warn(`Error reading unapply.ps1 for tweak: ${name}`, error);
      }
    }
    let meta = {};
    try {
      meta = JSON.parse(await fs$1.readFile(metaPath, "utf8"));
    } catch (error) {
      console.warn(`Error reading meta.json for tweak: ${name}`, error);
      continue;
    }
    tweaks.push({
      name,
      psapply,
      psunapply: psunapply || "",
      ...meta
    });
  }
  return tweaks;
}
const getNipPath = () => {
  if (isDev) {
    return path.resolve(process.cwd(), "resources", "sparklenvidia.nip");
  }
  return path.join(process.resourcesPath, "sparklenvidia.nip");
};
function isGPUTweak(tweak) {
  return !!(tweak.category && tweak.category.includes("GPU"));
}
function isNvidiaTweak(tweak) {
  return tweak.name === "optimize-nvidia-settings";
}
function NvidiaProfileInspector() {
  const exePath = getExePath("nvidiaProfileInspector.exe");
  const nipPath = getNipPath();
  return new Promise((resolve, reject) => {
    child_process.exec(`"${exePath}" -silentImport "${nipPath}"`, (error, stdout, stderr) => {
      console.log("stdout:", stdout);
      console.log("stderr:", stderr);
      if (error) {
        console.error("Error:", error);
        reject(error);
      } else {
        resolve(stdout || "Completed with no output.");
      }
    });
  });
}
const setupTweaksHandlers = () => {
  electron.ipcMain.handle("tweak-states:load", async () => {
    try {
      await fs$1.access(tweaksStatePath);
      const data = await fs$1.readFile(tweaksStatePath, "utf8");
      return data;
    } catch (error) {
      if (error.code === "ENOENT") {
        return JSON.stringify({});
      }
      console.error("Error loading tweak states:", error);
      throw error;
    }
  });
  electron.ipcMain.handle(
    "tweak-states:save",
    async (_event, payload) => {
      try {
        await fs$1.mkdir(path.dirname(tweaksStatePath), { recursive: true });
        await fs$1.writeFile(tweaksStatePath, payload, "utf8");
        return true;
      } catch (error) {
        console.error("Error saving tweak states:", error);
        throw error;
      }
    }
  );
  electron.ipcMain.handle("tweaks:fetch", async () => {
    return await loadTweaks();
  });
  electron.ipcMain.handle("tweak:background-app-count", async () => {
    const script = `$names = @('EpicGamesLauncher','EpicWebHelper','RiotClientServices','RiotClientUx','RiotClientUxRender','Battle.net','EADesktop','UbisoftConnect','upc','RockstarGamesLauncher','SocialClubHelper','Widgets','PhoneExperienceHost','YourPhone','GameBar','GameBarFTServer','XboxApp','XboxPcApp','ms-teams','Teams','Clipchamp'); @(Get-Process -Name $names -ErrorAction SilentlyContinue | Sort-Object Id -Unique).Count`;
    const result = await executePowerShell({ script, name: "background-app-count" });
    const count = Number.parseInt(String(result.output || "").trim(), 10);
    return { success: result.success, count: Number.isFinite(count) ? count : 0 };
  });
  electron.ipcMain.handle("tweak:apply", async (_, name) => {
    const tweaks = await loadTweaks();
    const tweak = tweaks.find((t) => t.name === name);
    if (!tweak) {
      throw new Error(`No apply script found for tweak: ${name}`);
    }
    if (isGPUTweak(tweak) || isNvidiaTweak(tweak)) {
      const gpuInfo = await detectGPU();
      if (isGPUTweak(tweak) && !gpuInfo.hasGPU) {
        throw new Error(`This tweak requires a dedicated GPU, but no compatible GPU was detected.`);
      }
      if (isNvidiaTweak(tweak) && !gpuInfo.isNvidia) {
        throw new Error(`This tweak is only for NVIDIA GPUs, but no NVIDIA GPU was detected.`);
      }
    }
    if (name === "optimize-nvidia-settings") {
      console.log(logo, "Running Nvidia settings optimization...");
      await NvidiaProfileInspector();
    } else {
      return executePowerShell({ script: tweak.psapply, name });
    }
  });
  electron.ipcMain.handle("tweak:unapply", async (_, name) => {
    const tweaks = await loadTweaks();
    const tweak = tweaks.find((t) => t.name === name);
    if (!tweak || !tweak.psunapply) {
      throw new Error(`No unapply script found for tweak: ${name}`);
    }
    return executePowerShell({ script: tweak.psunapply, name });
  });
  electron.ipcMain.handle("nvidia-inspector", (_, _args) => {
    return NvidiaProfileInspector();
  });
  electron.ipcMain.handle("tweak:active", () => {
    return getActiveTweaks();
  });
  console.log("[Sparkle main/tweakHandler.ts]: Tweak handlers setup complete");
};
const getActiveTweaks = () => {
  try {
    const data = fs.readFileSync(tweaksStatePath, "utf8");
    const parsed = JSON.parse(data);
    return Object.keys(parsed).filter((key) => parsed[key]);
  } catch (error) {
    console.error("Error loading tweak states:", error);
    return [];
  }
};
console.log = log.log;
console.error = log.error;
console.warn = log.warn;
function sanitizeIP(ip) {
  const valid = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return valid.test(ip) ? ip : "";
}
function sanitizeHostname(hostname) {
  return hostname.replace(/[^a-zA-Z0-9.-]/g, "");
}
const DNS_CONFIGS = {
  cloudflare: { primary: "1.1.1.1", secondary: "1.0.0.1", name: "Cloudflare" },
  google: { primary: "8.8.8.8", secondary: "8.8.4.4", name: "Google" },
  opendns: { primary: "208.67.222.222", secondary: "208.67.220.220", name: "OpenDNS" },
  quad9: { primary: "9.9.9.9", secondary: "149.112.112.112", name: "Quad9" },
  adguard: { primary: "94.140.14.14", secondary: "94.140.15.15", name: "Adguard DN" },
  automatic: { primary: "", secondary: "", name: "Automatic (DHCP)" }
};
const getActiveAdapters = async () => {
  return new Promise((resolve) => {
    child_process.exec(
      `Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | ConvertTo-Json -Compress`,
      { shell: "powershell.exe" },
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve([]);
          return;
        }
        try {
          const parsed = JSON.parse(stdout);
          const adapters = Array.isArray(parsed) ? parsed : [parsed];
          resolve(
            adapters.map((a) => ({
              name: a.Name,
              ifIndex: a.ifIndex
            }))
          );
        } catch {
          resolve([]);
        }
      }
    );
  });
};
const setDNSServers = async (ifIndex, dnsServers) => {
  return new Promise((resolve) => {
    let cmd;
    if (dnsServers === null) {
      cmd = `Set-DnsClientServerAddress -InterfaceIndex ${ifIndex} -ResetServerAddresses`;
    } else {
      const servers = dnsServers.map((s) => `'${s}'`).join(",");
      cmd = `Set-DnsClientServerAddress -InterfaceIndex ${ifIndex} -ServerAddresses @(${servers})`;
    }
    child_process.exec(cmd, { shell: "powershell.exe" }, (error) => {
      resolve(!error);
    });
  });
};
const flushDNS = async () => {
  return new Promise((resolve) => {
    child_process.exec("ipconfig /flushdns", { shell: "powershell.exe" }, () => resolve());
  });
};
const setupDNSHandlers = () => {
  electron.ipcMain.handle("dns:get-current", async () => {
    try {
      const script = `
      Write-Host "Current DNS Settings:"
      
      Get-DnsClientServerAddress |
      Where-Object { $_.ServerAddresses.Count -gt 0 } |
      ForEach-Object {
          $adapter = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex -ErrorAction SilentlyContinue
          if ($adapter) {
              $dnsList = $_.ServerAddresses | Where-Object { $_ -notmatch '^fec0' }
              if ($dnsList) {
                  Write-Host ("{0} | {1}" -f $adapter.Name, ($dnsList -join ', '))
              }
          }
      }
      `;
      const result = await executePowerShell({ script, name: "Get-DNS" });
      if (result.success) {
        const lines = result.output.trim().split("\n").filter((line) => line.includes("|"));
        const dnsInfo = lines.map((line) => {
          const [adapter, servers] = line.split("|");
          return { adapter: adapter.trim(), servers: servers.trim() };
        });
        return { success: true, data: dnsInfo };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(
    "dns:apply",
    async (_event, props) => {
      try {
        const { dnsType, primaryDNS = "", secondaryDNS = "" } = props;
        const normalizedType = dnsType.toLowerCase();
        if (normalizedType !== "custom" && !DNS_CONFIGS[normalizedType]) {
          return {
            success: false,
            error: "Invalid DNS type. Available options: cloudflare, google, opendns, quad9, adguard, automatic, custom"
          };
        }
        let config;
        if (normalizedType === "custom") {
          const safePrimary = sanitizeIP(primaryDNS);
          if (!safePrimary) {
            return { success: false, error: "Invalid primary DNS server address" };
          }
          const safeSecondary = sanitizeIP(secondaryDNS);
          config = { primary: safePrimary, secondary: safeSecondary, name: "Custom" };
        } else {
          config = DNS_CONFIGS[normalizedType];
        }
        const adapters = await getActiveAdapters();
        if (adapters.length === 0) {
          return { success: false, error: "No active network adapters found" };
        }
        const results = [];
        for (const adapter of adapters) {
          let dnsServers;
          if (normalizedType === "automatic" || !config.primary) {
            dnsServers = null;
          } else {
            dnsServers = [config.primary];
            if (config.secondary) dnsServers.push(config.secondary);
          }
          const success = await setDNSServers(adapter.ifIndex, dnsServers);
          if (success) {
            if (dnsServers === null) {
              results.push(`Set ${adapter.name} to automatic DNS (DHCP)`);
            } else {
              results.push(`Set ${adapter.name} to ${config.name} DNS: ${dnsServers.join(", ")}`);
            }
          } else {
            results.push(`Error configuring DNS for ${adapter.name}`);
          }
        }
        await flushDNS();
        return {
          success: true,
          output: results.join("\n") + "\nDNS configuration completed successfully!"
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  );
  electron.ipcMain.handle("dns:reset", async () => {
    try {
      const adapters = await getActiveAdapters();
      if (adapters.length === 0) {
        return { success: false, error: "No active network adapters found" };
      }
      const results = [];
      for (const adapter of adapters) {
        const success = await setDNSServers(adapter.ifIndex, null);
        if (success) {
          results.push(`Reset ${adapter.name} to automatic DNS (DHCP)`);
        } else {
          results.push(`Error resetting DNS for ${adapter.name}`);
        }
      }
      await flushDNS();
      return {
        success: true,
        output: results.join("\n") + "\nDNS settings reverted to automatic successfully!"
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(
    "dns:test",
    async (_event, props) => {
      try {
        const { hostname = "google.com" } = props;
        const safeHostname = sanitizeHostname(hostname) || "google.com";
        const script = `
        try {
          $result = nslookup ${safeHostname} 2>&1
          Write-Host "DNS Test Results for ${safeHostname}:"
          Write-Host $result
        } catch {
          Write-Host "Error testing DNS: $($_.Exception.Message)"
        }
      `;
        const result = await executePowerShell({ script, name: "Test-DNS" });
        return result;
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  );
  electron.ipcMain.handle(
    "dns:ping-all",
    async () => {
      try {
        const dnsServers = [
          { name: "Cloudflare", server: "1.1.1.1" },
          { name: "Google", server: "8.8.8.8" },
          { name: "OpenDNS", server: "208.67.222.222" },
          { name: "Quad9", server: "9.9.9.9" },
          { name: "AdGuard DNS", server: "94.140.14.14" }
        ];
        const pingServer = (server) => {
          return new Promise((resolve) => {
            child_process.exec(`ping -n 1 -w 1000 ${server}`, { shell: "cmd.exe" }, (error, stdout) => {
              if (error) {
                resolve({ latency: null, status: "error" });
                return;
              }
              const match = stdout.match(/Average[^\d]*(\d+)ms/i) || stdout.match(/Average = (\d+)ms/i);
              if (match) {
                resolve({ latency: parseInt(match[1], 10), status: "success" });
              } else if (stdout.includes("TTL=") || stdout.includes("ttl=")) {
                resolve({ latency: null, status: "timeout" });
              } else {
                resolve({ latency: null, status: "timeout" });
              }
            });
          });
        };
        const settled = await Promise.allSettled(
          dnsServers.map(async (dns) => {
            const pingResult = await pingServer(dns.server);
            return { name: dns.name, server: dns.server, ...pingResult };
          })
        );
        const results = settled.filter((r) => r.status === "fulfilled").map((r) => r.value);
        return { success: true, data: results };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  );
  electron.ipcMain.handle("dns:get-adapters", async () => {
    try {
      const script = `
        Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | ForEach-Object {
          Write-Host "$($_.Name)|$($_.InterfaceDescription)|$($_.Status)"
        }
      `;
      const result = await executePowerShell({ script, name: "Get-Adapters" });
      if (result.success) {
        const lines = result.output.trim().split("\n").filter((line) => line.includes("|"));
        const adapters = lines.map((line) => {
          const [name, description, status] = line.split("|");
          return { name: name.trim(), description: description.trim(), status: status.trim() };
        });
        return { success: true, data: adapters };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle("dns:flush-cache", async () => {
    try {
      const script = `
        Write-Host "Flushing DNS cache..."
        ipconfig /flushdns
        Write-Host "DNS cache flushed successfully!"
      `;
      const result = await executePowerShell({ script, name: "Flush-DNS" });
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  console.log("[Sparkle main/dnsHandler.ts]: DNS handlers setup complete");
};
console.log = log.log;
console.error = log.error;
console.warn = log.warn;
function runPowerShell(cmd) {
  return new Promise((resolve, reject) => {
    child_process.exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${cmd}"`,
      { windowsHide: true },
      (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message);
        resolve(stdout);
      }
    );
  });
}
function changeRestorePointCooldown() {
  return runPowerShell(
    "New-ItemProperty -Path 'HKLM:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore' -Name 'SystemRestorePointCreationFrequency' -Value 0 -PropertyType DWord -Force"
  );
}
function sanitizeRestorePointName(name) {
  return name.replace(/[^a-zA-Z0-9 _-]/g, "");
}
function getTimestamp() {
  const date = /* @__PURE__ */ new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`;
}
const setupBackupHandlers = () => {
  electron.ipcMain.handle("create-sparkle-restore-point", async () => {
    const label = `SparkleBackup-${getTimestamp()}`;
    try {
      await runPowerShell(`Checkpoint-Computer -Description '${label}'`);
      await changeRestorePointCooldown();
      return { success: true, label };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(
    "create-restore-point",
    async (_event, name) => {
      try {
        const safeName = name ? sanitizeRestorePointName(name) : "";
        const label = safeName ? `${safeName}-${getTimestamp()}` : `ManualRestore-${getTimestamp()}`;
        await runPowerShell(`Checkpoint-Computer -Description '${label}'`);
        await changeRestorePointCooldown();
        return { success: true, label };
      } catch (error) {
        console.error(error);
        return { success: false, error: error.message };
      }
    }
  );
  electron.ipcMain.handle(
    "delete-all-restore-points",
    async (_event, _sequenceNumber) => {
      try {
        await runPowerShell(`vssadmin delete shadows /all /quiet`);
        await changeRestorePointCooldown();
        return { success: true };
      } catch (error) {
        console.error("Error deleting all restore points:", error);
        return { success: false, error: error.message };
      }
    }
  );
  electron.ipcMain.handle("get-restore-points", async () => {
    try {
      const output = await runPowerShell(
        "Get-ComputerRestorePoint | Select-Object SequenceNumber, Description, CreationTime, EventType, RestorePointType | ConvertTo-Json"
      );
      await changeRestorePointCooldown();
      let points = [];
      try {
        points = JSON.parse(output);
        if (!Array.isArray(points)) points = [points];
      } catch {
        points = [];
      }
      return { success: true, points };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle(
    "restore-restore-point",
    async (_event, sequenceNumber) => {
      try {
        await runPowerShell(`Restore-Computer -RestorePoint ${sequenceNumber}`);
        await changeRestorePointCooldown();
        return { success: true };
      } catch (error) {
        console.error(error);
        return { success: false, error: error.message };
      }
    }
  );
  electron.ipcMain.handle("delete-old-sparkle-backups", async () => {
    return new Promise((resolve, reject) => {
      const sparkleRoot = `C:\\Sparkle`;
      if (!fs.existsSync(sparkleRoot)) {
        return resolve({ success: true, message: "Sparkle folder does not exist" });
      }
      fs.rm(sparkleRoot, { recursive: true, force: true }, (err) => {
        if (err) return reject(err);
        resolve({ success: true, message: "Sparkle folder deleted" });
      });
    });
  });
  console.log("[Sparkle main/backup.ts]: Backup handlers setup complete");
};
console.log = log.log;
console.error = log.error;
console.warn = log.warn;
let cache = null;
const getInstalledAppsScript = `
$paths = @(
  "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
  "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
  "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*"
)

$apps = @{}

foreach ($path in $paths) {
  Get-ItemProperty -Path $path -ErrorAction SilentlyContinue |
    Where-Object {
      $_.DisplayName -and
      $_.SystemComponent -ne 1 -and
      $_.DisplayName -notmatch '^(Update for|Security Update|Security Intelligence Update|Hotfix|KB\\d+|Cumulative Update|Definition Update|Update for Microsoft)'
    } |
    ForEach-Object {
      $id = ($_.DisplayName -replace '[^a-zA-Z0-9]', '-').ToLower()
      $apps[$id] = @{
        id = $id
        name = $_.DisplayName
        version = if ($_.DisplayVersion) { $_.DisplayVersion } else { '' }
        installDate = if ($_.InstallDate) { $_.InstallDate } else { '' }
        displayIcon = if ($_.DisplayIcon) { ($_.DisplayIcon -replace '"', '').Split(',')[0].Trim() } else { '' }
        publisher = if ($_.Publisher) { $_.Publisher } else { '' }
        installLocation = if ($_.InstallLocation) { $_.InstallLocation } else { '' }
        uninstallString = if ($_.UninstallString) { $_.UninstallString -replace '"', '' } else { '' }
        quietUninstallString = if ($_.QuietUninstallString) { $_.QuietUninstallString -replace '"', '' } else { '' }
        isStoreApp = $false
        packageName = ''
      }
    }
}

Get-AppxPackage |
  Where-Object {
    $_.Name -notmatch 'Microsoft\\.NET|Microsoft\\.VCLibs|Microsoft\\.UI|Microsoft\\.WindowsStore|Microsoft\\.StorePurchaseApp'
  } |
  ForEach-Object {
    $id = ('appx-' + $_.PackageFamilyName).ToLower()
    if (-not $apps.ContainsKey($id)) {
      $apps[$id] = @{
        id = $id
        name = $_.Name
        version = $_.Version.ToString()
        installDate = ''
        displayIcon = ''
        publisher = if ($_.Publisher -match 'O=([^,]+)') { $matches[1].Trim() } elseif ($_.Publisher -match 'CN=([^,]+)') { $matches[1].Trim() } else { $_.Publisher }
        installLocation = $_.InstallLocation
        uninstallString = ''
        quietUninstallString = ''
        isStoreApp = $true
        packageName = $_.PackageFullName
      }
    }
  }

$list = $apps.Values | Sort-Object name

if ($list.Count -eq 0) {
  return '[]'
}

$jsonParts = $list | ForEach-Object { $_ | ConvertTo-Json -Compress }
return "[$($jsonParts -join ',')]"
`;
const iconCacheDir = path.join(electron.app.getPath("userData"), "icon-cache");
function getIconCacheKey(filePath) {
  return crypto.createHash("md5").update(filePath.toLowerCase()).digest("hex");
}
async function getCachedIcon(filePath) {
  const cachePath = path.join(iconCacheDir, `${getIconCacheKey(filePath)}.png`);
  try {
    const data = await fs.promises.readFile(cachePath);
    return `data:image/png;base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}
async function setCachedIcon(filePath, dataUrl) {
  const cachePath = path.join(iconCacheDir, `${getIconCacheKey(filePath)}.png`);
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  await fs.promises.writeFile(cachePath, Buffer.from(base64Data, "base64"));
}
async function resolveIcon(displayIcon) {
  if (!displayIcon) return void 0;
  const cached = await getCachedIcon(displayIcon);
  if (cached) return cached;
  try {
    await fs.promises.access(displayIcon);
  } catch {
    return void 0;
  }
  try {
    const nativeIcon = await electron.app.getFileIcon(displayIcon, { size: "small" });
    const dataUrl = nativeIcon.toDataURL();
    setCachedIcon(displayIcon, dataUrl).catch(() => {
    });
    return dataUrl;
  } catch {
    return void 0;
  }
}
async function getInstalledApps() {
  if (cache) return cache;
  try {
    const result = await executePowerShell({
      script: getInstalledAppsScript,
      name: "Get-InstalledApps",
      output: false
    });
    if (!result.success) {
      console.error("Failed to get installed apps:", result.error);
      return [];
    }
    const rawApps = JSON.parse(result.output);
    const rawList = Array.isArray(rawApps) ? rawApps : [rawApps];
    fs.promises.mkdir(iconCacheDir, { recursive: true }).catch(() => {
    });
    const apps = await Promise.all(
      rawList.map(async (raw) => {
        const iconDataUrl = await resolveIcon(raw.displayIcon);
        return {
          id: raw.id,
          name: raw.name,
          publisher: raw.publisher || "",
          version: raw.version || "Unknown",
          installDate: raw.installDate || "Unknown",
          icon: iconDataUrl,
          uninstallString: raw.uninstallString || "",
          quietUninstallString: raw.quietUninstallString || "",
          isStoreApp: raw.isStoreApp || false,
          packageName: raw.packageName || ""
        };
      })
    );
    cache = apps;
    return apps;
  } catch (error) {
    console.error("Error getting installed apps:", error);
    return [];
  }
}
async function uninstallApps(_event, apps) {
  const results = [];
  for (const { name, uninstallString, quietUninstallString, isStoreApp, packageName } of apps) {
    if (!mainWindow$1) {
      results.push({ name, success: false, error: "Main window not available" });
      continue;
    }
    mainWindow$1.webContents.send("uninstall-progress", name);
    try {
      if (isStoreApp) {
        const script2 = `Remove-AppxPackage "${packageName}"`;
        const result2 = await executePowerShell({ script: script2, name: `Uninstall-${name}` });
        const success2 = result2.success;
        console.log(`Uninstall Store app ${name}: ${success2 ? "success" : "failed"}`);
        results.push({ name, success: success2, error: success2 ? void 0 : result2.error });
        continue;
      }
      const raw = quietUninstallString || uninstallString;
      if (!raw) {
        results.push({ name, success: false, error: "No uninstall string available" });
        continue;
      }
      const msiMatch = raw.match(/MsiExec\.exe\s+(.+)/i);
      if (!msiMatch) {
        const exeMatch = raw.match(/^(.+?\.exe)(.*)/i);
        if (!exeMatch) {
          results.push({ name, success: false, error: "Could not parse uninstall string" });
          continue;
        }
        const exePath = exeMatch[1].trim();
        const exeArgs = exeMatch[2].trim();
        const script2 = `$p = Start-Process '${exePath.replace(/'/g, "''")}' -ArgumentList '${exeArgs || "/S"}' -PassThru; $p.WaitForExit(); Start-Sleep -Seconds 2; $p.ExitCode`;
        const result2 = await executePowerShell({ script: script2, name: `Uninstall-${name}` });
        const exitCode2 = parseInt(result2.output?.trim() ?? "1", 10);
        const success2 = result2.success && (exitCode2 === 0 || exitCode2 === 3010);
        console.log(`Uninstall ${name}: exit ${exitCode2}`);
        results.push({ name, success: success2, error: success2 ? void 0 : `Exit code ${exitCode2}` });
        continue;
      }
      const script = `$p = Start-Process msiexec.exe -ArgumentList '${msiMatch[1].trim()} /quiet /norestart' -PassThru; $p.WaitForExit(); $p.ExitCode`;
      const result = await executePowerShell({
        script,
        name: `Uninstall-${name}`
      });
      const exitCode = parseInt(result.output?.trim() ?? "1", 10);
      const success = result.success && (exitCode === 0 || exitCode === 3010);
      console.log(`Uninstall ${name}: exit ${exitCode}`);
      results.push({ name, success, error: success ? void 0 : `Exit code ${exitCode}` });
    } catch (err) {
      console.error(`Uninstall ${name} failed:`, err);
      results.push({ name, success: false, error: String(err) });
    }
  }
  if (mainWindow$1) {
    mainWindow$1.webContents.send("uninstall-complete");
  }
  if (results.some((r) => r.success)) {
    cache = null;
  }
  return { success: results.some((r) => r.success), results };
}
function reloadApps() {
  cache = null;
  getInstalledApps();
}
const setupDebloatHandlers = () => {
  electron.ipcMain.handle("get-installed-apps", getInstalledApps);
  electron.ipcMain.handle("reload-installed-apps", reloadApps);
  electron.ipcMain.handle("uninstall-apps", uninstallApps);
};
console.log = log.log;
console.error = log.error;
console.warn = log.warn;
function systemRoot() {
  return process.env.SystemRoot || "C:\\Windows";
}
function localAppData() {
  return process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
}
const SIZE_WORKERS = 32;
async function getFolderSize(root) {
  const dirQueue = [root];
  let total = 0;
  let active = 0;
  const processDir = async (dir) => {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true }).catch(() => []);
    const subdirs = [];
    const fileSizes = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        subdirs.push(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        fileSizes.push(
          fs.promises.stat(path.join(dir, entry.name)).then((stat) => stat.size).catch(() => 0)
        );
      }
    }
    const sizes = await Promise.all(fileSizes);
    for (const size of sizes) total += size;
    dirQueue.push(...subdirs);
  };
  const workers = Array.from({ length: SIZE_WORKERS }, async () => {
    while (true) {
      active++;
      const dir = dirQueue.pop();
      if (!dir) {
        active--;
        if (active === 0) return;
        await new Promise((resolve) => setTimeout(resolve, 1));
        continue;
      }
      try {
        await processDir(dir);
      } finally {
        active--;
      }
    }
  });
  await Promise.all(workers);
  return total;
}
async function emptyFolderContents(root) {
  const entries = await fs.promises.readdir(root, { withFileTypes: true }).catch(() => []);
  const freed = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(root, entry.name);
      let size = 0;
      try {
        const stat = await fs.promises.lstat(full);
        size = stat.isDirectory() ? await getFolderSize(full) : stat.size;
      } catch {
        size = 0;
      }
      await fs.promises.rm(full, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 }).catch(() => {
      });
      return size;
    })
  );
  return freed.reduce((sum, size) => sum + size, 0);
}
async function thumbnailFiles() {
  const thumbCache = path.join(localAppData(), "Microsoft", "Windows", "Explorer");
  const entries = await fs.promises.readdir(thumbCache, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isFile() && /^thumbcache_.*\.db$/i.test(entry.name)).map((entry) => path.join(thumbCache, entry.name));
}
async function getThumbnailCacheSize() {
  const files = await thumbnailFiles();
  const sizes = await Promise.all(
    files.map(
      (file) => fs.promises.stat(file).then((stat) => stat.size).catch(() => 0)
    )
  );
  return sizes.reduce((sum, size) => sum + size, 0);
}
async function clearThumbnailCache() {
  const files = await thumbnailFiles();
  let freed = 0;
  await Promise.all(
    files.map(async (file) => {
      const stat = await fs.promises.stat(file).catch(() => null);
      if (stat) freed += stat.size;
      await fs.promises.rm(file, { force: true, maxRetries: 2, retryDelay: 100 }).catch(() => {
      });
    })
  );
  return freed;
}
function recycleBinScript(withClear) {
  return `
    $recycleBinSize = 0
    $shell = New-Object -ComObject Shell.Application
    $recycleBin = $shell.Namespace(0xA)
    $recycleBinSize = ($recycleBin.Items() | Measure-Object -Property Size -Sum).Sum
    if ($null -eq $recycleBinSize) { $recycleBinSize = 0 }
    ${withClear ? "Clear-RecycleBin -Force -ErrorAction SilentlyContinue" : ""}
    Write-Output $recycleBinSize
  `;
}
async function runRecycleBinScript(script, name) {
  const result = await executePowerShell({ script, name, output: false });
  return parseInt((result.output || "0").trim(), 10) || 0;
}
const targets = [
  {
    id: "temp",
    size: async () => {
      const tempDirs = [path.join(systemRoot(), "Temp"), os.tmpdir()];
      const sizes = await Promise.all(tempDirs.map((dir) => getFolderSize(dir)));
      return sizes.reduce((sum, size) => sum + size, 0);
    },
    clean: async () => {
      const tempDirs = [path.join(systemRoot(), "Temp"), os.tmpdir()];
      const freed = await Promise.all(tempDirs.map((dir) => emptyFolderContents(dir)));
      return freed.reduce((sum, size) => sum + size, 0);
    }
  },
  {
    id: "prefetch",
    size: () => getFolderSize(path.join(systemRoot(), "Prefetch")),
    clean: () => emptyFolderContents(path.join(systemRoot(), "Prefetch"))
  },
  {
    id: "recyclebin",
    size: () => runRecycleBinScript(recycleBinScript(false), "size-recyclebin"),
    clean: () => runRecycleBinScript(recycleBinScript(true), "cleanup-recyclebin")
  },
  {
    id: "windows-update",
    size: () => getFolderSize(path.join(systemRoot(), "SoftwareDistribution", "Download")),
    clean: () => emptyFolderContents(path.join(systemRoot(), "SoftwareDistribution", "Download"))
  },
  {
    id: "thumbnails",
    size: getThumbnailCacheSize,
    clean: clearThumbnailCache
  },
  {
    id: "errorreports",
    size: () => getFolderSize(path.join(localAppData(), "CrashDumps")),
    clean: () => emptyFolderContents(path.join(localAppData(), "CrashDumps"))
  }
];
const targetById = new Map(targets.map((target) => [target.id, target]));
const sizesCache = new TtlCache(15e3);
async function getAllSizes() {
  const cached = sizesCache.get("all");
  if (cached) return cached;
  const results = {};
  await Promise.all(
    targets.map(async (target) => {
      try {
        results[target.id] = await target.size();
      } catch (error) {
        log.warn(`Failed to get size for ${target.id}:`, error);
        results[target.id] = 0;
      }
    })
  );
  sizesCache.set("all", results, 15e3);
  return results;
}
async function cleanTarget(id) {
  const target = targetById.get(id);
  if (!target) throw new Error(`Unknown cleaner target: ${id}`);
  const freed = await target.clean();
  sizesCache.delete("all");
  return freed;
}
const setupCleanerHandlers = () => {
  electron.ipcMain.handle("cleaner:get-sizes", () => getAllSizes());
  electron.ipcMain.handle("cleaner:run-cleanup", (_event, id) => cleanTarget(id));
};
function initAutoUpdater(getMainWindow) {
  electronUpdater.autoUpdater.autoDownload = true;
  electronUpdater.autoUpdater.disableWebInstaller = false;
  electronUpdater.autoUpdater.autoInstallOnAppQuit = true;
  if (!electron.app.isPackaged) {
    electronUpdater.autoUpdater.forceDevUpdateConfig = true;
  }
  electronUpdater.autoUpdater.on("update-available", (info) => {
    const win = getMainWindow();
    win?.webContents.send("updater:available", {
      version: info.version,
      releaseNotes: info.releaseNotes ?? void 0
    });
  });
  electronUpdater.autoUpdater.on("update-not-available", () => {
    const win = getMainWindow();
    win?.webContents.send("updater:not-available", { currentVersion: electron.app.getVersion() });
  });
  electronUpdater.autoUpdater.on("error", (err) => {
    const win = getMainWindow();
    win?.webContents.send("updater:error", { message: String(err) });
  });
  electronUpdater.autoUpdater.on("download-progress", (progress) => {
    const win = getMainWindow();
    win?.webContents.send("updater:download-progress", {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond
    });
  });
  electronUpdater.autoUpdater.on("update-downloaded", (info) => {
    const win = getMainWindow();
    win?.webContents.send("updater:downloaded", { version: info.version });
  });
  electron.ipcMain.handle("updater:get-version", () => electron.app.getVersion());
  electron.ipcMain.handle("updater:check", async () => {
    try {
      const result = await electronUpdater.autoUpdater.checkForUpdates();
      return { ok: true, updateInfo: result?.updateInfo ?? null };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("updater:download", async () => {
    try {
      await electronUpdater.autoUpdater.downloadUpdate();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  });
  electron.ipcMain.handle("updater:install", () => {
    try {
      electronUpdater.autoUpdater.quitAndInstall(false, true);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  });
  setTimeout(() => triggerAutoUpdateCheck(), 3e3);
}
async function triggerAutoUpdateCheck() {
  try {
    await electronUpdater.autoUpdater.checkForUpdates();
  } catch {
  }
}
const version = "2.24.0";
const jsonData = {
  version
};
const store$1 = new Store();
const CLIENT_ID = "1188686354490609754";
const MAX_RECONNECT_ATTEMPTS = 3;
let client = null;
function buildActivity() {
  return new discordRpcNew.PresenceBuilder().setType(discordRpcNew.ActivityType.Playing).setDetails("Optimizing your PC").setState(`Running Sparkle v${jsonData.version}`).setLargeImage("sparklelogo", "Sparkle Debloat").addButton("Download Sparkle", "https://parcoil.com/sparkle").addButton("Join Discord", "https://discord.com/invite/En5YJYWj3Z").build();
}
async function startDiscordRPC() {
  if (client) {
    return false;
  }
  const rpc = new discordRpcNew.Client({ maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS });
  client = rpc;
  rpc.on("READY", () => {
    log.log("(rpc) Discord RPC connected");
    try {
      rpc.setActivity(buildActivity());
      log.log("(rpc) Activity set successfully");
    } catch (err) {
      log.warn("(rpc) Failed to set Discord RPC activity:", err.message);
    }
  });
  rpc.on("disconnected", () => log.log("(rpc) Discord RPC disconnected"));
  rpc.on("close", () => log.log("(rpc) Discord RPC connection closed"));
  rpc.on("ERROR", (error) => log.warn("(rpc) Discord RPC error:", error.message));
  try {
    await rpc.login({ clientId: CLIENT_ID });
  } catch (error) {
    log.warn("(rpc) Discord RPC initialization failed:", error.message);
    await stopDiscordRPC();
  }
  return true;
}
async function stopDiscordRPC() {
  if (!client) {
    return true;
  }
  const current = client;
  client = null;
  try {
    await current.destroy();
  } catch (error) {
    log.warn("(rpc) Error stopping Discord RPC:", error.message);
  }
  log.log("(rpc) Discord RPC disconnected");
  return true;
}
electron.ipcMain.handle("start-discord-rpc", () => startDiscordRPC());
electron.ipcMain.handle("stop-discord-rpc", () => stopDiscordRPC());
electron.ipcMain.handle("rpc-enabled:get", () => store$1.get("rpcEnabled") !== false);
electron.ipcMain.handle("rpc-enabled:set", (_event, value) => {
  store$1.set("rpcEnabled", value);
  if (value) {
    startDiscordRPC();
  } else {
    stopDiscordRPC();
  }
  return value;
});
process.env.UV_THREADPOOL_SIZE = "32";
console.log = log.log;
console.error = log.error;
console.warn = log.warn;
log.initialize();
const store = new Store();
let trayInstance = null;
if (store.get("showTray") === void 0) {
  store.set("showTray", false);
}
electron.ipcMain.handle("tray:get", () => {
  return store.get("showTray");
});
electron.ipcMain.handle("tray:set", (_event, value) => {
  store.set("showTray", value);
  if (mainWindow) {
    if (value) {
      if (!trayInstance) {
        trayInstance = createTray(mainWindow);
      }
    } else {
      if (trayInstance) {
        trayInstance.destroy();
        trayInstance = null;
      }
    }
  }
  return store.get("showTray");
});
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron.app.quit();
} else {
  electron.app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
let mainWindow = null;
function createWindow() {
  console.log("[Sparkle]: createWindow called");
  console.log("[Sparkle]: __dirname =", __dirname);
  console.log("[Sparkle]: icon path =", getResourcePath("sparkle2.ico"));
  console.log("[Sparkle]: preload path =", path.join(__dirname, "../preload/index.js"));
  console.log("[Sparkle]: renderer path =", path.join(__dirname, "../renderer/index.html"));
  try {
    mainWindow = new electron.BrowserWindow({
      width: 1380,
      backgroundColor: "#0c121f",
      height: 760,
      // minWidth: 1380,
      // minHeight: 760,
      minWidth: 790,
      center: true,
      frame: false,
      show: false,
      autoHideMenuBar: true,
      icon: getResourcePath("sparkle2.ico"),
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.js"),
        devTools: electron.app.isPackaged ? false : true,
        sandbox: false,
        spellcheck: false
      }
    });
    console.log("[Sparkle]: BrowserWindow created");
    setMainWindow(mainWindow);
  } catch (err) {
    console.error("[Sparkle]: BrowserWindow creation failed:", err);
    throw err;
  }
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    console.log("[Sparkle]: Loading renderer from URL:", process.env["ELECTRON_RENDERER_URL"]);
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    console.log("[Sparkle]: Loading renderer from file");
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  mainWindow.once("ready-to-show", () => {
    console.log("[Sparkle]: Window ready to show");
    mainWindow.show();
  });
  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription) => {
      console.error("[Sparkle]: Renderer failed to load:", errorCode, errorDescription);
    }
  );
}
electron.app.commandLine.appendSwitch("no-sandbox");
electron.app.whenReady().then(() => {
  console.log("[Sparkle]: App ready, creating window...");
  try {
    createWindow();
    console.log("[Sparkle]: Window created successfully");
  } catch (err) {
    console.error("[Sparkle]: createWindow failed:", err);
  }
  initAutoUpdater(() => mainWindow);
  console.log("[Sparkle]: Auto updater initialized");
  if (store.get("showTray")) {
    console.log("[Sparkle]: Creating tray...");
    try {
      trayInstance = createTray(mainWindow);
      console.log("[Sparkle]: Tray created");
    } catch (err) {
      console.error("[Sparkle]: Tray creation failed:", err);
    }
  }
  setupPowerShellHandlers();
  setupSystemHandlers();
  setupTweaksHandlers();
  setupDNSHandlers();
  setupBackupHandlers();
  setupDebloatHandlers();
  setupCleanerHandlers();
  if (store.get("rpcEnabled") !== false) {
    startDiscordRPC();
  }
  console.log("[Sparkle]: Handlers setup complete");
  electron.ipcMain.on("window-minimize", () => {
    if (mainWindow) mainWindow.minimize();
  });
  electron.ipcMain.on("window-toggle-maximize", () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });
  electron.ipcMain.on("window-close", () => {
    if (mainWindow) {
      if (store.get("showTray")) {
        mainWindow.hide();
      } else {
        electron.app.quit();
      }
    }
  });
  electron.ipcMain.handle("open-devtools", () => {
    if (mainWindow) {
      mainWindow.webContents.openDevTools();
    }
  });
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((err) => {
  console.error("[Sparkle]: app.whenReady failed:", err);
});
