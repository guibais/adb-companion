import { useState, useEffect, useRef } from "react";
import { FileText, Play, Square, Trash2, Download, Filter } from "lucide-react";
import { Button, Input, PageHeader } from "../components/ui";
import { useDeviceStore, useUiStore } from "../stores";
import type { LogcatEntry, LogLevel } from "../types";

const LOG_COLORS: Record<LogLevel, string> = {
  V: "text-zinc-500",
  D: "text-blue-400",
  I: "text-green-400",
  W: "text-yellow-400",
  E: "text-red-400",
  F: "text-red-600",
};

export function LogcatPage() {
  const { devices, tabs, activeTabId } = useDeviceStore();
  const { addToast } = useUiStore();

  const [logs, setLogs] = useState<LogcatEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [filter, setFilter] = useState({
    tag: "",
    search: "",
    level: "" as LogLevel | "",
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeDevice = activeTab?.deviceId
    ? devices.find((d) => d.id === activeTab.deviceId)
    : null;

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  useEffect(() => {
    const unsubscribe = window.electronEvents["logcat:entry"]((entry) => {
      setLogs((prev) => [...prev.slice(-5000), entry]);
    });

    return () => {
      unsubscribe();
      if (activeDevice && isRunning) {
        window.electronAPI["adb:logcat-stop"](activeDevice.id);
      }
    };
  }, []);

  const handleStart = () => {
    if (!activeDevice) return;

    window.electronAPI["adb:logcat-start"](activeDevice.id, {
      tag: filter.tag || undefined,
      level: filter.level || undefined,
      search: filter.search || undefined,
    });
    setIsRunning(true);
    addToast({ type: "success", title: "Logcat started" });
  };

  const handleStop = () => {
    if (!activeDevice) return;

    window.electronAPI["adb:logcat-stop"](activeDevice.id);
    setIsRunning(false);
    addToast({ type: "info", title: "Logcat stopped" });
  };

  const handleClear = async () => {
    if (!activeDevice) return;

    setLogs([]);
    await window.electronAPI["adb:logcat-clear"](activeDevice.id);
    addToast({ type: "info", title: "Logs cleared" });
  };

  const handleExport = () => {
    const content = logs
      .map(
        (l) =>
          `${l.timestamp} ${l.pid}/${l.tid} ${l.level}/${l.tag}: ${l.message}`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logcat_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({ type: "success", title: "Logs exported" });
  };

  const filteredLogs = logs.filter((log) => {
    if (filter.level && log.level < filter.level) return false;
    if (filter.tag && !log.tag.toLowerCase().includes(filter.tag.toLowerCase()))
      return false;
    if (
      filter.search &&
      !log.message.toLowerCase().includes(filter.search.toLowerCase())
    )
      return false;
    return true;
  });

  if (!activeDevice) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">
            No Device Selected
          </h2>
          <p className="text-sm text-zinc-500">Connect a device to view logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 overflow-hidden h-full flex flex-col">
      <PageHeader title="Logcat">
        <Button variant="secondary" size="sm" onClick={handleClear}>
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4" />
        </Button>
        {isRunning ? (
          <Button variant="danger" size="sm" onClick={handleStop}>
            <Square className="w-4 h-4" />
            Stop
          </Button>
        ) : (
          <Button size="sm" onClick={handleStart}>
            <Play className="w-4 h-4" />
            Start
          </Button>
        )}
      </PageHeader>
      <div className="flex items-center gap-3 bg-bg-secondary border border-border rounded-lg p-3">
        <Filter className="w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Filter by tag..."
          value={filter.tag}
          onChange={(e) => setFilter({ ...filter, tag: e.target.value })}
          className="flex-1"
        />
        <Input
          placeholder="Search messages..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          className="flex-1"
        />
        <select
          value={filter.level}
          onChange={(e) =>
            setFilter({ ...filter, level: e.target.value as LogLevel | "" })
          }
          className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-white"
        >
          <option value="">All Levels</option>
          <option value="V">Verbose</option>
          <option value="D">Debug</option>
          <option value="I">Info</option>
          <option value="W">Warning</option>
          <option value="E">Error</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          Auto-scroll
        </label>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-bg-secondary border border-border rounded-lg font-mono text-xs"
      >
        {filteredLogs.map((log, idx) => (
          <div
            key={idx}
            className="px-3 py-1 hover:bg-bg-tertiary border-b border-border flex items-start gap-2"
          >
            <span className="text-zinc-600 w-24 flex-shrink-0">
              {log.timestamp.split(" ")[1]}
            </span>
            <span className="text-zinc-500 w-16 flex-shrink-0">
              {log.pid}/{log.tid}
            </span>
            <span
              className={`w-4 flex-shrink-0 font-bold ${LOG_COLORS[log.level]}`}
            >
              {log.level}
            </span>
            <span className="text-purple-400 w-32 flex-shrink-0 truncate">
              {log.tag}
            </span>
            <span className="text-zinc-300 flex-1 break-all">
              {log.message}
            </span>
          </div>
        ))}
        <div ref={logsEndRef} />

        {logs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">
              {isRunning
                ? "Waiting for logs..."
                : "Click Start to begin capturing logs"}
            </p>
          </div>
        )}
      </div>

      <div className="text-xs text-zinc-500 flex justify-between">
        <span>
          {filteredLogs.length} entries{" "}
          {filter.tag || filter.search || filter.level ? "(filtered)" : ""}
        </span>
        <span>{isRunning ? "🔴 Recording" : "⏸️ Paused"}</span>
      </div>
    </div>
  );
}
