import { EventEmitter } from "events";
import { exec } from "child_process";
import { promisify } from "util";
import { nanoid } from "nanoid";
import QRCode from "qrcode";

const execAsync = promisify(exec);

type PairingState = "idle" | "waiting" | "pairing" | "paired" | "error";

type PairingInfo = {
  name: string;
  password: string;
  qrCodeDataUrl: string;
  state: PairingState;
  error?: string;
  device?: {
    address: string;
    port: number;
  };
};

export class WifiPairingService extends EventEmitter {
  private pairingInfo: PairingInfo | null = null;
  private discoveryInterval: NodeJS.Timeout | null = null;
  private getAdbPath: () => string;

  constructor(getAdbPath: () => string) {
    super();
    this.getAdbPath = getAdbPath;
  }

  private get adbPath(): string {
    return this.getAdbPath();
  }

  async startPairing(): Promise<PairingInfo> {
    this.stopPairing();

    const name = `ADB_WIFI_${nanoid(10)}`;
    const password = nanoid(12);

    const qrText = `WIFI:T:ADB;S:${name};P:${password};;`;

    const qrCodeDataUrl = await QRCode.toDataURL(qrText, {
      width: 256,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });

    this.pairingInfo = {
      name,
      password,
      qrCodeDataUrl,
      state: "waiting",
    };

    this.emit("state-change", this.pairingInfo);
    this.startDiscovery();

    return this.pairingInfo;
  }

  private async startDiscovery() {
    try {
      const mDnsSd = require("node-dns-sd");

      const discover = async () => {
        if (!this.pairingInfo || this.pairingInfo.state !== "waiting") {
          return;
        }

        try {
          const devices = await mDnsSd.discover({
            name: "_adb-tls-pairing._tcp.local",
            wait: 3,
          });

          if (devices && devices.length > 0) {
            const device = devices[0];
            const address = device.address;
            const port = device.service?.port || device.port;

            if (address && port) {
              this.pairingInfo!.device = { address, port };
              this.pairingInfo!.state = "pairing";
              this.emit("state-change", this.pairingInfo);

              await this.pairDevice(address, port);
            }
          }
        } catch (err) {
          console.error("mDNS discovery error:", err);
        }
      };

      await discover();

      this.discoveryInterval = setInterval(discover, 2000);
    } catch (err) {
      console.error("Failed to start mDNS discovery:", err);
      this.pairingInfo!.state = "error";
      this.pairingInfo!.error = "Failed to start device discovery";
      this.emit("state-change", this.pairingInfo);
    }
  }

  private async pairDevice(address: string, port: number) {
    if (!this.pairingInfo) return;

    try {
      const cmd = `"${this.adbPath}" pair ${address}:${port} ${this.pairingInfo.password}`;
      console.log("Pairing command:", cmd);

      const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });

      if (
        stdout.toLowerCase().includes("successfully paired") ||
        stdout.toLowerCase().includes("paired")
      ) {
        this.pairingInfo.state = "paired";
        this.emit("state-change", this.pairingInfo);
        this.stopDiscovery();

        await this.connectAfterPairing(address);
      } else if (stderr) {
        console.error("Pairing stderr:", stderr);
        this.pairingInfo.state = "error";
        this.pairingInfo.error = stderr;
        this.emit("state-change", this.pairingInfo);
      }
    } catch (err: any) {
      console.error("Pairing error:", err);
      this.pairingInfo.state = "error";
      this.pairingInfo.error = err.message || "Failed to pair device";
      this.emit("state-change", this.pairingInfo);
    }
  }

  private async connectAfterPairing(address: string) {
    try {
      const mDnsSd = require("node-dns-sd");

      const connectDevices = await mDnsSd.discover({
        name: "_adb-tls-connect._tcp.local",
        wait: 5,
      });

      if (connectDevices && connectDevices.length > 0) {
        for (const device of connectDevices) {
          if (device.address === address) {
            const port = device.service?.port || device.port;
            if (port) {
              const cmd = `"${this.adbPath}" connect ${address}:${port}`;
              console.log("Connect command:", cmd);
              await execAsync(cmd, { timeout: 10000 });
              this.emit("connected", { address, port });
              return;
            }
          }
        }
      }

      const defaultPort = 5555;
      const cmd = `"${this.adbPath}" connect ${address}:${defaultPort}`;
      console.log("Connect command (default port):", cmd);
      await execAsync(cmd, { timeout: 10000 });
      this.emit("connected", { address, port: defaultPort });
    } catch (err) {
      console.error("Connect after pairing error:", err);
    }
  }

  stopPairing() {
    this.stopDiscovery();
    this.pairingInfo = null;
  }

  private stopDiscovery() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
  }

  getPairingInfo(): PairingInfo | null {
    return this.pairingInfo;
  }

  async manualPair(ip: string, port: number, code: string): Promise<boolean> {
    try {
      const cmd = `"${this.adbPath}" pair ${ip}:${port} ${code}`;
      console.log("Manual pair command:", cmd);

      const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 });

      if (
        stdout.toLowerCase().includes("successfully paired") ||
        stdout.toLowerCase().includes("paired")
      ) {
        return true;
      }

      console.error("Manual pair failed:", stderr || stdout);
      return false;
    } catch (err) {
      console.error("Manual pair error:", err);
      return false;
    }
  }

  async connect(ip: string, port: number): Promise<boolean> {
    try {
      const cmd = `"${this.adbPath}" connect ${ip}:${port}`;
      console.log("Connect command:", cmd);

      const { stdout, stderr } = await execAsync(cmd, { timeout: 10000 });

      if (stdout.includes("connected") && !stdout.includes("cannot")) {
        return true;
      }

      console.error("Connect failed:", stderr || stdout);
      return false;
    } catch (err) {
      console.error("Connect error:", err);
      return false;
    }
  }
}
