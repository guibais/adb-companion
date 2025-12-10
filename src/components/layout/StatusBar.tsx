import { useDeviceStore, useBinaryStore } from '../../stores'

export function StatusBar() {
    const { devices, tabs, activeTabId } = useDeviceStore()
    const { status } = useBinaryStore()

    const activeTab = tabs.find(t => t.id === activeTabId)
    const activeDevice = activeTab?.deviceId
        ? devices.find(d => d.id === activeTab.deviceId)
        : null

    return (
        <footer className="h-6 bg-bg-secondary border-t border-border flex items-center justify-between px-4 text-xs text-zinc-500">
            <div className="flex items-center gap-4">
                {activeDevice ? (
                    <>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${activeDevice.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                            <span>
                                {activeDevice.status === 'connected' ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                        <span>via {activeDevice.connectionType.toUpperCase()}</span>
                        <span>{activeDevice.model}</span>
                    </>
                ) : (
                    <span>No device connected</span>
                )}
            </div>

            <div className="flex items-center gap-4">
                {status?.platformTools.isInstalled && (
                    <span>ADB v{status.platformTools.version}</span>
                )}
                {status?.scrcpy.isInstalled && (
                    <span>scrcpy v{status.scrcpy.version}</span>
                )}
                <span>{devices.length} device(s)</span>
            </div>
        </footer>
    )
}
