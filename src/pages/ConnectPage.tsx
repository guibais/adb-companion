import { useState, useEffect } from "react";
import {
  Smartphone,
  Wifi,
  Cable,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  Loader2,
  QrCode,
  Scan,
  Link,
} from "lucide-react";
import { Button, Input, Modal } from "../components/ui";
import { useDeviceStore, useUiStore } from "../stores";
import type { WifiPairingInfo } from "../types";

export function ConnectPage() {
  const { devices, setDevices, setLoadingDevices, isLoadingDevices, addTab } =
    useDeviceStore();
  const { addToast, setCurrentPage } = useUiStore();

  const [showWifiModal, setShowWifiModal] = useState(false);
  const [connectIp, setConnectIp] = useState("");
  const [connectPort, setConnectPort] = useState("5555");
  const [pairCode, setPairCode] = useState("");
  const [pairPort, setPairPort] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [isPaired, setIsPaired] = useState(false);
  const [pairingInfo, setPairingInfo] = useState<WifiPairingInfo | null>(null);

  useEffect(() => {
    refreshDevices();
    const interval = setInterval(refreshDevices, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = window.electronEvents["wifi:pairing-state"]((info) => {
      setPairingInfo(info);
      if (info.state === "paired") {
        addToast({
          type: "success",
          title: "Device paired!",
          message: "Connecting...",
        });
      } else if (info.state === "error") {
        addToast({
          type: "error",
          title: "Pairing failed",
          message: info.error,
        });
      }
    });

    const unsubscribeConnected = window.electronEvents["wifi:connected"](
      (device) => {
        addToast({
          type: "success",
          title: "Connected!",
          message: `Device at ${device.address}:${device.port}`,
        });
        setShowWifiModal(false);
        refreshDevices();
      }
    );

    return () => {
      unsubscribe();
      unsubscribeConnected();
    };
  }, []);

  const refreshDevices = async () => {
    try {
      setLoadingDevices(true);
      const deviceList = await window.electronAPI["adb:list-devices"]();
      setDevices(deviceList);
    } catch (err) {
      console.error("Failed to refresh devices:", err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      const success = await window.electronAPI["wifi:connect"](
        connectIp,
        parseInt(connectPort)
      );
      if (success) {
        addToast({ type: "success", title: "Connected successfully!" });
        setShowWifiModal(false);
        refreshDevices();
        resetWifiForm();
      } else {
        addToast({
          type: "error",
          title: "Connection failed",
          message: "Make sure the device is on the same network and paired",
        });
      }
    } catch (err) {
      addToast({
        type: "error",
        title: "Connection error",
        message: String(err),
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualPair = async () => {
    setIsPairing(true);

    try {
      const success = await window.electronAPI["wifi:manual-pair"](
        connectIp,
        parseInt(pairPort),
        pairCode
      );
      if (success) {
        addToast({
          type: "success",
          title: "Paired successfully!",
          message: "Now you can connect to the device",
        });
        setIsPaired(true);
        setPairCode("");
        setPairPort("");
      } else {
        addToast({
          type: "error",
          title: "Pairing failed",
          message: "Check the code and try again",
        });
      }
    } catch (err) {
      addToast({ type: "error", title: "Pairing error", message: String(err) });
    } finally {
      setIsPairing(false);
    }
  };

  const resetWifiForm = () => {
    setConnectIp("");
    setConnectPort("5555");
    setPairCode("");
    setPairPort("");
    setIsPaired(false);
    setPairingInfo(null);
  };

  const openWifiModal = async () => {
    resetWifiForm();
    setIsScanning(false);
    setShowWifiModal(true);

    try {
      const info = await window.electronAPI["wifi:start-pairing"]();
      setPairingInfo(info);
    } catch (err) {
      console.error("Failed to start pairing:", err);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to start WiFi pairing",
      });
    }
  };

  const closeWifiModal = () => {
    setShowWifiModal(false);
    window.electronAPI["wifi:stop-pairing"]();
    resetWifiForm();
  };

  const handleStartScanning = () => {
    setIsScanning(true);
  };

  const openDeviceTab = (deviceId: string) => {
    addTab(deviceId);
    setCurrentPage("device");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">Connect Device</h1>
          <p className="text-zinc-400 text-lg">
            Choose a connection method to add a new Android device
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <button
            onClick={handleStartScanning}
            className={`group bg-bg-secondary border-2 rounded-2xl p-8 text-left transition-all hover:shadow-lg hover:shadow-accent/5 ${
              isScanning
                ? "border-accent"
                : "border-border hover:border-accent/50"
            }`}
          >
            <div className="p-4 bg-blue-500/10 rounded-xl w-fit mb-6 group-hover:bg-blue-500/20 transition-colors">
              <Cable className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              USB Connection
            </h3>
            <p className="text-zinc-400 mb-4">
              Connect your device via USB cable. Fastest and most reliable
              method.
            </p>
            <ul className="text-sm text-zinc-500 space-y-2 mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Enable USB Debugging on device
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Connect USB cable
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Accept connection prompt
              </li>
            </ul>
            {isScanning && (
              <div className="flex items-center gap-2 text-accent">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Scanning for devices...</span>
              </div>
            )}
          </button>

          <button
            onClick={openWifiModal}
            className="group bg-bg-secondary border-2 border-border hover:border-accent/50 rounded-2xl p-8 text-left transition-all hover:shadow-lg hover:shadow-accent/5"
          >
            <div className="p-4 bg-purple-500/10 rounded-xl w-fit mb-6 group-hover:bg-purple-500/20 transition-colors">
              <Wifi className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              WiFi Connection
            </h3>
            <p className="text-zinc-400 mb-4">
              Connect wirelessly over your local network. Scan QR code from your
              device.
            </p>
            <ul className="text-sm text-zinc-500 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Enable Wireless Debugging
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Scan QR code to pair
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Same network required
              </li>
            </ul>
            <div className="flex items-center gap-2 mt-4 text-accent font-medium">
              <QrCode className="w-5 h-5" />
              <span>Scan QR Code</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>

        {devices.length > 0 && (
          <div className="bg-bg-secondary border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Available Devices
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshDevices}
                loading={isLoadingDevices}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 bg-bg-tertiary rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Smartphone className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">
                          {device.model}
                        </h3>
                        {device.connectionType === "wifi" ? (
                          <Wifi className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <Cable className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                      <p className="text-sm text-zinc-500">
                        {device.manufacturer} • Android {device.androidVersion}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        device.status === "connected"
                          ? "bg-green-500/20 text-green-400"
                          : device.status === "unauthorized"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {device.status}
                    </span>
                    {device.status === "connected" && (
                      <Button
                        size="sm"
                        onClick={() => openDeviceTab(device.id)}
                      >
                        Open
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {devices.length === 0 && isScanning && (
          <div className="bg-bg-secondary border border-border rounded-2xl p-12 text-center">
            <Loader2 className="w-12 h-12 text-accent mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-white mb-2">
              Scanning for devices...
            </h3>
            <p className="text-sm text-zinc-500">
              Make sure your device is connected and USB Debugging is enabled
            </p>
          </div>
        )}

        <p className="text-center text-sm text-zinc-600 mt-8">
          Don't have USB Debugging enabled? Go to{" "}
          <strong>Settings → Developer Options → USB Debugging</strong>
        </p>
      </div>

      <Modal
        isOpen={showWifiModal}
        onClose={closeWifiModal}
        title="WiFi Connection"
        size="2xl"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2 bg-bg-tertiary rounded-xl p-5 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-5 h-5 text-accent" />
                <h3 className="text-base font-semibold text-white">
                  Scan to Pair
                </h3>
              </div>

              {pairingInfo?.qrCodeDataUrl ? (
                <div className="p-3 bg-white rounded-xl shadow-lg">
                  <img
                    src={pairingInfo.qrCodeDataUrl}
                    alt="Pairing QR Code"
                    className="w-44 h-44"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 bg-bg-secondary rounded-xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                </div>
              )}

              <p className="text-xs text-zinc-400 text-center mt-3 max-w-[200px]">
                Go to{" "}
                <strong className="text-zinc-300">Wireless Debugging</strong> →{" "}
                <strong className="text-zinc-300">"Pair with QR code"</strong>
              </p>

              {pairingInfo?.state === "waiting" && (
                <div className="flex items-center gap-2 mt-3 text-accent text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Waiting for device...</span>
                </div>
              )}

              {pairingInfo?.state === "pairing" && (
                <div className="flex items-center gap-2 mt-3 text-yellow-400 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Pairing...</span>
                </div>
              )}

              {pairingInfo?.state === "paired" && (
                <div className="flex items-center gap-2 mt-3 text-green-400 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  <span>Paired! Connecting...</span>
                </div>
              )}
            </div>

            <div className="md:w-1/2 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-px bg-border md:hidden" />
                <span className="text-xs text-zinc-500 uppercase">
                  Manual Connection
                </span>
                <div className="flex-1 h-px bg-border md:hidden" />
              </div>

              {!isPaired ? (
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 bg-accent/20 text-accent rounded-full flex items-center justify-center text-xs">
                      1
                    </span>
                    Pair with Code
                  </h4>
                  <p className="text-xs text-zinc-500 mb-3">
                    Use "Pair with pairing code" option on device.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="IP Address"
                      placeholder="192.168.1.100"
                      value={connectIp}
                      onChange={(e) => setConnectIp(e.target.value)}
                    />
                    <Input
                      label="Pair Port"
                      placeholder="37123"
                      value={pairPort}
                      onChange={(e) => setPairPort(e.target.value)}
                    />
                  </div>
                  <div className="mt-2">
                    <Input
                      label="6-Digit Code"
                      placeholder="123456"
                      value={pairCode}
                      onChange={(e) => setPairCode(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleManualPair}
                    loading={isPairing}
                    className="w-full mt-3"
                    disabled={!connectIp || !pairPort || !pairCode}
                    variant="secondary"
                    size="sm"
                  >
                    <Scan className="w-4 h-4" />
                    Pair
                  </Button>
                  <p className="text-xs text-zinc-500 text-center mt-2">
                    Already paired?{" "}
                    <button
                      onClick={() => setIsPaired(true)}
                      className="text-accent hover:underline"
                    >
                      Skip →
                    </button>
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-400">
                          Paired!
                        </p>
                        <p className="text-xs text-green-400/70">
                          Enter connection port below
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg-tertiary rounded-xl p-4">
                    <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 bg-accent/20 text-accent rounded-full flex items-center justify-center text-xs">
                        2
                      </span>
                      Connect
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="IP Address"
                        placeholder="192.168.1.100"
                        value={connectIp}
                        onChange={(e) => setConnectIp(e.target.value)}
                      />
                      <Input
                        label="Port"
                        placeholder="5555"
                        value={connectPort}
                        onChange={(e) => setConnectPort(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleConnect}
                      loading={isConnecting}
                      className="w-full mt-3"
                      disabled={!connectIp}
                      size="sm"
                    >
                      <Link className="w-4 h-4" />
                      Connect
                    </Button>
                    <p className="text-xs text-zinc-500 text-center mt-2">
                      <button
                        onClick={() => setIsPaired(false)}
                        className="text-accent hover:underline"
                      >
                        ← Back to Pair
                      </button>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
